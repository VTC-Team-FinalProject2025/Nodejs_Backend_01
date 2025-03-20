import { Server, Socket } from "socket.io";
import authWebSocketMiddleware from "../../middlewares/authWebSocket.middleware";
import ChatChannelRepository from "../../repositories/chatChannelRepository";
import NotificationRepository from "../../repositories/notificationRepository";

export class ChatChannelController {
  private readonly io: Server;
  private readonly chatChanelRepo: ChatChannelRepository;
  private readonly notiRepo: NotificationRepository;

  constructor(
    io: Server,
    chatChanelRepo: ChatChannelRepository,
    notiRepo: NotificationRepository,
  ) {
    this.io = io;
    this.chatChanelRepo = chatChanelRepo;
    (this.notiRepo = notiRepo), this.setupSocketEvents();
  }

  private setupSocketEvents() {
    this.io.use(authWebSocketMiddleware);
    const chatNamespace = this.io.of("/chat-channel");
    chatNamespace.on("connect", async (socket: Socket) => {
      const userId = String(socket.data.userId);
      const channelId = String(socket.handshake.auth?.channelId);
      console.log("channelId",userId, channelId)

      if (!userId || !channelId) {
        console.log("❌ Connection rejected: Missing userId or channelId");
        socket.disconnect();
        return;
      }
      const sortedIds = [userId, channelId].sort();
      const chatRoomId = `chatRoom-channel-${sortedIds[0]}-${sortedIds[1]}`;
      socket.join(chatRoomId);
      console.log(`✅ User ${userId} joined ${chatRoomId}`);
      socket.on("sendMessage", async (messageData) => {
        const { message } = messageData;
        if (!message) return;
        const savedMessage = await this.chatChanelRepo.saveMessage(
          Number(userId),
          Number(channelId),
          message,
        );

        chatNamespace.to(chatRoomId).emit("newMessage", savedMessage);
      });

      socket.on("deleteMessage", async ({ messageId }) => {
        if (!messageId) return;

        const message = await this.chatChanelRepo.getMessageById(messageId, Number(channelId));
        if (!message) return;

        // Chỉ cho phép sender xoá tin nhắn
        if (message.senderId !== Number(userId)) {
          console.log("❌ Không thể xoá tin nhắn của người khác");
          return;
        }

        await this.chatChanelRepo.deleteMessageById(messageId);

        chatNamespace.to(chatRoomId).emit("statusDeleMessage", message.id );
      });
    });
  }
}
