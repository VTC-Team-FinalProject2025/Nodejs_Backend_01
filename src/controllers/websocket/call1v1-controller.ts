import { Server, Socket } from "socket.io";
import { Database } from "firebase-admin/database";
import authWebSocketMiddleware from "../../middlewares/authWebSocket.middleware";
import NotificationRepository from "../../repositories/notificationRepository";
import UserRepository from "../../repositories/UserRepository";

interface CallPayload {
    recieverId: number;
}

const userSocketMap = new Map<number, Set<string>>();


export class Call1v1Controller {
    private readonly io: Server;
    private readonly db: Database;
    private readonly notiRepo: NotificationRepository;
    private readonly userRepo: UserRepository;

    constructor(
        io: Server,
        db: Database,
        notiRepo: NotificationRepository,
        userRepo: UserRepository,
    ) {
        this.io = io;
        this.db = db;
        this.notiRepo = notiRepo;
        this.userRepo = userRepo;
        this.setupSocketEvents();
    }

    private setupSocketEvents() {
        const callNamespace = this.io.of("/call1v1");
        callNamespace.use(authWebSocketMiddleware);

        callNamespace.on("connect", async (socket: Socket) => {
            const userId = socket.data.userId;

            // Thêm socketId mới vào danh sách
            if (!userSocketMap.has(userId)) {
                userSocketMap.set(userId, new Set());
            }
            userSocketMap.get(userId)!.add(socket.id);

            console.log("✅ Connect userId", userId, "with socket", socket.id);

            socket.on("call", async (data: CallPayload) => {
                let user = await this.userRepo.getUserById(Number(userId));

                const callSnapshot = await this.db.ref(`/calls/${data.recieverId}`).once("value");
                if (callSnapshot.exists()) {
                    const socketIds = userSocketMap.get(userId);
                    socketIds?.forEach((id) => {
                        callNamespace.to(id).emit("user_in_call", {
                            userId: data.recieverId,
                        });
                    });
                    console.warn(`❗ User ${data.recieverId} is already in a call.`);
                    return;
                }

                const targetSocketIds = userSocketMap.get(data.recieverId);
                if (targetSocketIds && targetSocketIds.size > 0) {
                    let peerId = data.recieverId;

                    await this.notiRepo.sendPushNotification(
                        data.recieverId,
                        `${user.firstName + " " + user.lastName} đang gọi cho bạn`
                    );

                    this.db.ref(`/calls/${userId}`).set({
                        peerId,
                        timestamp: Date.now(),
                    });

                    this.db.ref(`/calls/${peerId}`).set({
                        peerId: userId,
                        timestamp: Date.now(),
                    });

                    targetSocketIds.forEach((id) => {
                        callNamespace.to(id).emit("incomingCall", {
                            senderId: userId,
                            senderName: `${user.firstName + " " + user.lastName}`,
                            senderAvatar: user.avatarUrl,
                            recieverId: data.recieverId,
                        });
                    });
                } else {
                    const callerSocketIds = userSocketMap.get(userId);
                    callerSocketIds?.forEach((id) => {
                        callNamespace.to(id).emit("user_not_online", {
                            userId: data.recieverId,
                        });
                    });
                    console.warn(`⚠️ User ${data.recieverId} is not online.`);
                }
            });

            socket.on("acceptCall", async (data: { recieverId: number }) => {
                const peerId = data.recieverId;
                const targetSocketIds = userSocketMap.get(peerId);
                targetSocketIds?.forEach((id) => {
                    callNamespace.to(id).emit("callAccepted", {
                        recieverId: userId,
                    });
                });
            });

            socket.on("declineCall", async ({ recieverId }: { recieverId: number }) => {
                const callerId = recieverId;
                const callerSocketIds = userSocketMap.get(callerId);

                this.db.ref(`/calls/${userId}`).remove();
                this.db.ref(`/calls/${callerId}`).remove();

                callerSocketIds?.forEach((id) => {
                    callNamespace.to(id).emit("callDeclined", {
                        recieverId: userId,
                    });
                });

                console.log(`📞 User ${userId} declined call from ${callerId}`);
            });

            socket.on("endCall", async ({ recieverId }: { recieverId: number }) => {
                const peerId = recieverId;
                const peerSocketIds = userSocketMap.get(peerId);

                peerSocketIds?.forEach((id) => {
                    callNamespace.to(id).emit("callEnded", {
                        reason: "ended_by_user",
                    });
                });

                await this.db.ref(`/calls/${userId}`).remove();
                await this.db.ref(`/calls/${peerId}`).remove();

                console.log(`📞 User ${userId} ended call with ${peerId}`);
            });

            socket.on("cancelCall", async (_) => {
                const callPayload = await this.db.ref(`/calls/${userId}`);
                const callSnapshot = await callPayload.once("value");

                if (!callSnapshot.exists()) {
                    console.log(`❗ User ${userId} has no active call to cancel.`);
                    return;
                }

                const peerId = callSnapshot.val().peerId;
                const peerSocketIds = userSocketMap.get(peerId);

                peerSocketIds?.forEach((id) => {
                    callNamespace.to(id).emit("callCanceled", {
                        recieverId: userId,
                    });
                });

                this.db.ref(`/calls/${userId}`).remove();
                this.db.ref(`/calls/${peerId}`).remove();
                console.log(`📞 User ${userId} canceled call to ${peerId}`);
            });

            socket.on("disconnect", async () => {
                console.log(`🔌 Disconnected socket ${socket.id} from user ${userId}`);

                const socketSet = userSocketMap.get(userId);
                if (socketSet) {
                    socketSet.delete(socket.id);
                    if (socketSet.size === 0) {
                        userSocketMap.delete(userId);
                    }
                }

                const callSnapshot = await this.db.ref(`/calls/${userId}`).once("value");
                if (callSnapshot.exists()) {
                    const peerId = callSnapshot.val().peerId;

                    this.db.ref(`/calls/${userId}`).remove();
                    this.db.ref(`/calls/${peerId}`).remove();

                    const peerSocketIds = userSocketMap.get(peerId);
                    peerSocketIds?.forEach((id) => {
                        callNamespace.to(id).emit("callEnded", {
                            reason: "peer_disconnected",
                        });
                    });
                }
            });
        });
    }
}
