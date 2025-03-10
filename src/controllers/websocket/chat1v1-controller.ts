import { Server, Socket } from "socket.io";
import { Database } from "firebase-admin/database";
import Chat1v1Repository from "../../repositories/chat1v1Repository";
import authWebSocketMiddleware from "../../middlewares/authWebSocket.middleware";
import NotificationRepository from "../../repositories/notificationRepository";

export class Chat1v1Controller {
  private readonly io: Server;
  private readonly db: Database;
  private readonly chat1v1Repo: Chat1v1Repository;
  private readonly notiRepo: NotificationRepository;

  constructor(
    io: Server,
    db: Database,
    chat1v1Repo: Chat1v1Repository,
    notiRepo: NotificationRepository,
  ) {
    this.io = io;
    this.db = db;
    this.chat1v1Repo = chat1v1Repo;
    this.notiRepo = notiRepo;
    this.setupSocketEvents();
  }

  private setupSocketEvents() {
    const chatNamespace = this.io.of("/chat1v1");
    chatNamespace.use(authWebSocketMiddleware);
    chatNamespace.on("connect", async (socket: Socket) => {
      const userId = String(socket.data.userId);
      const chatWithUserId = String(
        socket.handshake.auth?.chatWithUserId || "",
      );

      if (!userId || !chatWithUserId) {
        console.log("❌ Connection rejected: Missing userId or chatWithUserId");
        socket.disconnect();
        return;
      }

      const sortedIds = [userId, chatWithUserId].sort();
      const chatRoomId = `chatRoom-${sortedIds[0]}-${sortedIds[1]}`;
      socket.join(chatRoomId);
      console.log(`✅ User ${userId} joined ${chatRoomId}`);

      const unreadMessagesSnapshot = await this.db
        .ref(`unreadMessages/${userId}`)
        .once("value");
      if (unreadMessagesSnapshot.exists()) {
        const unreadMessages = Object.values(unreadMessagesSnapshot.val());
        socket.emit("unreadMessages", unreadMessages);
        await this.db.ref(`unreadMessages/${userId}`).remove();
      }

      // Gửi lịch sử tin nhắn (mặc định lấy trang 1)
      const messages = await this.chat1v1Repo.getMessages(
        Number(userId),
        Number(chatWithUserId),
        1,
        20,
      );
      socket.emit("chatHistory", { messages, currentPage: 1 });

      // Sự kiện gửi tin nhắn
      socket.on("sendMessage", async (messageData) => {
        const { senderId, receiverId, message } = messageData;
        if (!senderId || !receiverId || !message) return;

        const savedMessage = await this.chat1v1Repo.saveMessage(
          senderId,
          receiverId,
          message,
        );
        await this.notiRepo.sendPushNotification(
          receiverId,
          `${savedMessage.Sender.loginName} đã gửi tin nhắn cho bạn`,
        );


        const receiverChats = await this.chat1v1Repo.ListRecentChats(receiverId);

        this.io.to(`user-${receiverId}`).emit("recentChatsList", receiverChats);

        // Cập nhật tin nhắn mới nhất
        const updatedMessages = await this.chat1v1Repo.getMessages(
          senderId,
          receiverId,
          1,
          20,
        );
        socket.to(`chatRoom-${sortedIds[0]}-${sortedIds[1]}`).emit("chatHistory", {
          messages: updatedMessages,
          currentPage: 1,
        });
      });

      // Sự kiện tải thêm tin nhắn cũ
      socket.on("loadMoreMessages", async ({ page }) => {
        const oldMessages = await this.chat1v1Repo.getMessages(
          Number(userId),
          Number(chatWithUserId),
          page,
          20,
        );
        socket.emit("moreMessages", { messages: oldMessages, page });
      });

      // Xác nhận đã đọc tin nhắn
      socket.on("markAsRead", async ({ userId }) => {
        await this.chat1v1Repo.markMessagesAsRead(userId);
        this.io.to(chatRoomId).emit("messagesRead", { chatRoomId, userId });
      });

      // Xử lý trạng thái "đang nhập"
      socket.on("typingStatus", ({ isTyping }) => {
        this.io.to(chatRoomId).emit("userTyping", { userId, isTyping });
      });

      // Xử lý khi người dùng rời khỏi chat
      socket.on("disconnect", async () => {
        console.log(`❌ User ${userId} disconnected`);
      });
    });
  }
}
