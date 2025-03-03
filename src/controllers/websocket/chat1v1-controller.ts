import { Server, Socket } from "socket.io";
import { Database } from "firebase-admin/database";
import Chat1v1Repository from "../../repositories/chat1v1Repository";
import authWebSocketMiddleware from "../../middlewares/authWebSocket.middleware";

export class Chat1v1Controller {
  private readonly io: Server;
  private readonly db: Database;
  private readonly chat1v1Repo: Chat1v1Repository;

  constructor(io: Server, db: Database, chat1v1Repo: Chat1v1Repository) {
    this.io = io;
    this.db = db;
    this.chat1v1Repo = chat1v1Repo;
    this.setupSocketEvents();
  }

  private setupSocketEvents() {
    const chatNamespace = this.io.of("/chat1v1");
    chatNamespace.use(authWebSocketMiddleware);
    chatNamespace.on("connect", async (socket: Socket) => {
      const userId = String(socket.data.userId);
      const chatWithUserId = String(socket.handshake.auth?.chatWithUserId || "");

      if (!userId || !chatWithUserId) {
        console.log("❌ Connection rejected: Missing userId or chatWithUserId");
        socket.disconnect();
        return;
      }

      const sortedIds = [userId, chatWithUserId].sort();
      const chatRoomId = `chatRoom-${sortedIds[0]}-${sortedIds[1]}`;
      socket.join(chatRoomId);
      console.log(`✅ User ${userId} joined ${chatRoomId}`);


      // Gửi tin nhắn chưa đọc nếu có
      const unreadMessagesSnapshot = await this.db.ref(`unreadMessages/${userId}`).once("value");
      if (unreadMessagesSnapshot.exists()) {
        const unreadMessages = Object.values(unreadMessagesSnapshot.val());
        socket.emit("unreadMessages", unreadMessages);
        await this.db.ref(`unreadMessages/${userId}`).remove();
      }

      // Gửi lịch sử tin nhắn
      const messages = await this.chat1v1Repo.getMessages(Number(userId), Number(chatWithUserId));
      socket.emit("chatHistory", messages);

      // Sự kiện gửi tin nhắn
      socket.on("sendMessage", async (messageData) => {
        const { senderId, receiverId, message } = messageData;
        if (!senderId || !receiverId || !message) return;

        // Lưu tin nhắn vào database
        const savedMessage = await this.chat1v1Repo.saveMessage(senderId, receiverId, message);

        // Kiểm tra nếu người nhận online
        const isReceiverOnline = await this.db.ref(`usersOnline/${receiverId}`).once("value");
        if (isReceiverOnline.exists()) {
          this.io.to(chatRoomId).emit("newMessage", savedMessage);
        } else {
          await this.db.ref(`unreadMessages/${receiverId}/${savedMessage.id}`).set(savedMessage);
        }

        // Cập nhật lại lịch sử tin nhắn
        const updatedMessages = await this.chat1v1Repo.getMessages(senderId, receiverId);
        socket.emit("chatHistory", updatedMessages);
      });

      // Xác nhận đã đọc tin nhắn
      socket.on("markAsRead", async ({ userId }) => {
        await this.chat1v1Repo.markMessagesAsRead(userId);
        this.io.to(chatRoomId).emit("messagesRead", { chatRoomId, userId });
      });

      // 🎯 Xử lý trạng thái trỏ vào ô input
      socket.on("typingStatus", ({ isTyping }) => {
        this.io.to(chatRoomId).emit("userTyping", { userId, isTyping });
      });

      // Xử lý khi người dùng rời khỏi chat
      socket.on("disconnect", async () => {
        console.log(`❌ User ${userId} disconnected`);
        await this.db.ref(`usersOnline/${userId}`).remove();
      });
    });
  }
}