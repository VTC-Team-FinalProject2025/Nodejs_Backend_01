import { Server, Socket } from "socket.io";
import authWebSocketMiddleware from "../../middlewares/authWebSocket.middleware";
import ChatChannelRepository from "../../repositories/chatChannelRepository";
import NotificationRepository from "../../repositories/notificationRepository";
import { encrypt } from "../../helpers/Encryption";
import PQueue from "p-queue";

export class ChatChannelController {
  private readonly io: Server;
  private readonly chatChanelRepo: ChatChannelRepository;
  private readonly notiRepo: NotificationRepository;
  private readonly messageQueue: PQueue;

  constructor(
    io: Server,
    chatChanelRepo: ChatChannelRepository,
    notiRepo: NotificationRepository,
  ) {
    this.io = io;
    this.chatChanelRepo = chatChanelRepo;
    (this.notiRepo = notiRepo),
      (this.messageQueue = new PQueue({ concurrency: 1 }));
    this.setupSocketEvents();
  }

  private setupSocketEvents() {
    const chatNamespace = this.io.of("/chat-channel");
    chatNamespace.use(authWebSocketMiddleware);
    chatNamespace.on("connect", async (socket: Socket) => {
      const userId = String(socket.data.userId);
      const channelId = String(socket.handshake.auth?.channelId);

      if (!userId || !channelId) {
        console.log("❌ Connection rejected: Missing userId or channelId");
        socket.disconnect();
        return;
      }
      const chatRoomId = `chatRoom-channel-${channelId}`;
      socket.join(chatRoomId);
      console.log(`✅ User ${userId} joined ${chatRoomId}`);
      socket.on("sendMessage", async (messageData) => {
        this.messageQueue.add(async () => {
          const { message } = messageData;
          if (!message) return;
          const encrypted = encrypt(message);
          const savedMessage = await this.chatChanelRepo.saveMessage(
            Number(userId),
            Number(channelId),
            String(encrypted),
          );

          chatNamespace.to(chatRoomId).emit("newMessage", savedMessage);
        });
      });

      socket.on("deleteMessage", async ({ messageId }) => {
        if (!messageId) return;

        const message = await this.chatChanelRepo.getMessageById(
          messageId,
          Number(channelId),
        );
        if (!message) return;

        // Chỉ cho phép sender xoá tin nhắn
        if (message.senderId !== Number(userId)) {
          console.log("❌ Không thể xoá tin nhắn của người khác");
          return;
        }

        await this.chatChanelRepo.deleteMessageById(messageId);

        chatNamespace.to(chatRoomId).emit("statusDeleMessage", message.id);
      });

      socket.on("markAsRead", async ({ userId, messageId }) => {
        this.messageQueue.add(async () => {
          if (!userId || !messageId) {
            console.error("Missing userId or messageId");
            return;
          }
        
          try {
            const messageRead = await this.chatChanelRepo.isMessageRead(Number(userId), Number(messageId));
        
            if (messageRead) {
              console.log(`User ${userId} has already read message ${messageId}`);
              return; 
            }
        
            await this.chatChanelRepo.markMessagesAsRead(Number(userId), Number(messageId));
            
            this.io.to(`user-${Number(userId)}`).emit("messagesRead", { userId, messageId });
          } catch (error) {
            console.log("Error marking message as read:", error);
          }
        })
      });

      socket.on("disconnect", async () => {
        console.log(`❌ User ${userId} disconnected`);
      });
    });
  }
}
