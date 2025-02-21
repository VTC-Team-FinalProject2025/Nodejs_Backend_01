import { Server, Socket } from "socket.io";
import { Database } from "firebase-admin/database";

export class OnlineUserController {
  private io: Server;
  private db: Database;

  constructor(io: Server, db: Database) {
    this.io = io;
    this.db = db;
    this.setupSocketEvents();
  }

  private setupSocketEvents() {
    this.io.on("connection", async (socket: Socket) => {
      const userId = socket.data.userId;
      if (!userId) {
        console.log("❌ Connection rejected: No userId");
        socket.disconnect();
        return;
      }

      console.log(`🔗 Client connected: ${userId}`);
      await this.setUserStatus(userId, true);

      socket.on("disconnect", () => this.handleDisconnect(userId));
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
}
