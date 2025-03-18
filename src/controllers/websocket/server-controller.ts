import { Server, Socket } from "socket.io";
import authWebSocketMiddleware from "../../middlewares/authWebSocket.middleware";
import { Database } from "firebase-admin/database";
import ChannelRepository from "../../repositories/channelRepository";
import { PrismaClient } from "@prisma/client";

export class ServerController {
    private readonly io: Server;
    private readonly db: Database;
    private readonly channelRepo: ChannelRepository;
    constructor(io: Server, db: Database) {
        this.io = io;
        this.db = db;
        this.channelRepo = new ChannelRepository(new PrismaClient(), db);
        this.setupSocketEvents();
    }

    private setupSocketEvents() {
        const roomNamespace = this.io.of("/server");
        roomNamespace.use(authWebSocketMiddleware);

        roomNamespace.on("connect", async (socket: Socket) => {
            const userId = String(socket.data.userId);
            console.log(`🔗 User ${userId} connected`);

            const handleOnJoinServer = async ({ serverId }: { serverId: string }) => {

                socket.join(serverId);
                console.log(`✅ User ${userId} joined server ${serverId}`);
                const handleOnJoinChannel = async ({ channelId, loginName, isMicMuted, avatarUrl }: {
                    channelId: string,
                    loginName: string,
                    isMicMuted: boolean,
                    avatarUrl: string,
                }) => {
                    if (!channelId || !loginName || !userId) {
                        console.log("❌ Missing required data in joinRoom");
                        return;
                    }

                    // remove user from all channels before joining new channel
                    await this.channelRepo.handleRemoveUserFromChannel(
                        {
                            userId,
                            callback:
                                (channelId) => {
                                    roomNamespace.to(serverId).emit("userLeft", { userId, channelId })
                                    console.log(`❌ User ${userId} left room ${channelId} before joining new channel`);
                                }
                        }
                    );

                    console.log(`✅ ${loginName} joined channel ${channelId}`);

                    // Cập nhật trạng thái của user vào Firebase
                    const userRef = this.db.ref(`channels/${channelId}/participants/${userId}`);
                    await userRef.set({
                        userId,
                        loginName,
                        isMicMuted,
                        avatarUrl,
                        isVideoOn: false,
                        isDesktopShared: false,
                    });

                    // **Lưu channel vào danh sách user đang tham gia**
                    const userChannelsRef = this.db.ref(`users/${userId}/channels/${channelId}`);
                    await userChannelsRef.set(true); // Hoặc có thể lưu thêm metadata nếu cần

                    // Thông báo đến các thành viên khác
                    roomNamespace.to(serverId).emit("userJoined", {
                        channelId,
                        userId,
                        loginName,
                        isMicMuted,
                        avatarUrl,
                    });

                };

                const handleOnLeaveChannel = async ({ channelId }: { channelId: string }) => {
                    console.log(`❌ User ${userId} left room ${channelId}`);
                    this.channelRepo.handleRemoveUserFromChannel({ userId, callback: (channelId) => roomNamespace.to(serverId).emit("userLeft", { userId, channelId }) });
                    // // Xóa danh sách các channel mà user đang tham gia
                    // await this.db.ref(`users/${userId}/channels`).remove();
                    // // Xóa user khỏi danh sách tham gia phòng trong Firebase
                    // await this.db.ref(`channels/${channelId}/participants/${userId}`).remove();

                    // Gửi thông báo đến các thành viên khác
                    // roomNamespace.to(serverId).emit("userLeft", { userId, channelId });
                }

                const handleOnToggleMic = async ({ channelId, isMicMuted }: { channelId: string, isMicMuted: boolean }) => {
                    await this.db.ref(`channels/${channelId}/participants/${userId}`).update({ isMicMuted });

                    // Gửi thông báo đến các thành viên khác
                    roomNamespace.to(serverId).emit("toggleMic", { userId, isMicMuted, channelId });
                }

                const handleOnToggleVideo = async ({ channelId, isVideoOn }: { channelId: string, isVideoOn: boolean }) => {
                    await this.db.ref(`channels/${channelId}/participants/${userId}`).update({ isVideoOn });

                    roomNamespace.to(serverId).emit("toggleVideo", { userId, isVideoOn, channelId });
                }

                const handleOnShareScreen = async ({ channelId, isDesktopShared }: { channelId: string, isDesktopShared: boolean }) => {
                    await this.db.ref(`channels/${channelId}/participants/${userId}`).update({ isDesktopShared });

                    roomNamespace.emit("toggleShareScreen", { userId, isDesktopShared, channelId });
                }

                const handleOnLeaveServer = async ({ serverId }: { serverId: string }) => {
                    socket.removeAllListeners("leaveChannel")
                    socket.removeAllListeners("joinChannel")
                    socket.removeAllListeners("toggleMic")
                    socket.removeAllListeners("toggleVideo")
                    socket.removeAllListeners("toggleShareScreen")
                    socket.removeAllListeners("leaveServer")
                    socket.removeAllListeners("disconnect")
                    await this.channelRepo.handleRemoveUserFromChannel(
                        {
                            userId,
                            callback:
                                (channelId) =>
                                    socket.to(serverId).emit("userLeft", { userId, channelId })
                        }
                    );
                    // Xóa danh sách các channel mà user đang tham gia
                    // await this.db.ref(`users/${userId}/channels`).remove();
                    socket.leave(serverId);
                    console.log(`❌ User ${userId} left server ${serverId}`);
                    // ✨ Xóa tất cả các listener để tránh memory leak
                }

                const handleOnDisconnect = async () => {
                    console.log(`❌ User ${userId} disconnected 1`);
                    // Xử lý khi user rời phòng
                    await this.channelRepo.handleRemoveUserFromChannel(
                        {
                            userId,
                            callback:
                                (channelId) =>
                                    roomNamespace.emit("userLeft", { userId, channelId })
                        }
                    );
                    // Xóa danh sách các channel mà user đang tham gia
                    // this.db.ref(`users/${userId}/channels`).remove();
                    socket.leave(serverId);
                }

                socket.on("joinChannel", handleOnJoinChannel);

                // Xử lý khi user rời phòng
                socket.on("leaveChannel", handleOnLeaveChannel);

                // Xử lý bật/tắt mic
                socket.on("toggleMic", handleOnToggleMic);

                // Xử lý bật/tắt video
                socket.on("toggleVideo", handleOnToggleVideo);

                // Xử lý chia sẻ màn hình
                socket.on("toggleShareScreen", handleOnShareScreen);

                socket.on("leaveServer", handleOnLeaveServer);

                socket.on("disconnect", handleOnDisconnect);
            }


            socket.on("joinServer", handleOnJoinServer);
        });
    }

}
