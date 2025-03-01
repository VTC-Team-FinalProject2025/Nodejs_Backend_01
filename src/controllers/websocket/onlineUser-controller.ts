import { Server, Socket } from "socket.io";
import { Database } from "firebase-admin/database";
import NotificationRepository from "../../repositories/notificationRepository";
export class OnlineUserController {
  private io: Server;
  private db: Database;
  private notiRepo: NotificationRepository;

  constructor(io: Server, db: Database, notiRepo: NotificationRepository) {
    this.io = io;
    this.db = db;
    this.notiRepo = notiRepo;
    this.setupSocketEvents();
  }

  private setupSocketEvents() {
    this.io.on("connection", async (socket: Socket) => {
      const userId = String(socket.data.userId);
      if (!userId || userId === "undefined") {
        console.log("❌ Connection rejected: No valid userId");
        socket.disconnect();
        return;
      }

      socket.join(String(userId));

      await this.setUserStatus(userId, true);

      this.sendNotificationCount(Number(userId));

      socket.on("markNotificationsAsRead", async () => {
        await this.notiRepo.markAsRead(Number(userId));
        await this.sendNotificationCount(Number(userId));
      });

      socket.on("saveTokenNotification", async (token: string) => {
        if(token) {
          await this.notiRepo.saveTokenNotification(Number(userId), String(token));
        }
      });

      console.log(`🔗 Client connected: ${userId}`);

      socket.on("disconnect", async () => {
        await this.handleDisconnect(userId);
      });
    });
  }

  private async handleDisconnect(userId: string) {
    console.log(`❌ Client disconnected: ${userId}`);

    try {
      await this.db.ref(`usersOnline/${userId}`).remove();
      console.log(`🗑️ User ${userId} đã bị xóa khỏi Realtime Database`);
    } catch (error) {
      console.error(`❌ Lỗi khi xóa user ${userId}:`, error);
    }
  }

  private async setUserStatus(userId: string, isOnline: boolean) {
    const userRef = this.db.ref(`usersOnline/${userId}`);

    if (isOnline) {
      await userRef.set({
        online: true,
        lastSeen: new Date().toISOString(),
      });
    } else {
      await userRef.update({
        online: false,
        lastSeen: new Date().toISOString(),
      });
    }
  }

  private async sendNotificationCount(userId: number) {
    const unreadCount = await this.notiRepo.countUnreadNotifications(userId);
    this.io.to(String(userId)).emit("newNotificationCount", unreadCount);
  }
}
