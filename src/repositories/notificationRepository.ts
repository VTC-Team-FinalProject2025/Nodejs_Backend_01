import { PrismaClient, TypeStatusNotification } from "@prisma/client";
import { MulticastMessage } from "firebase-admin/messaging";
import { firebaseAdmin } from "../configs/firebase";
type NotificationCreateInput = {
  userId: number;
  message: string;
  type: TypeStatusNotification;
};

interface ListUserChannel {
  id: number;
  loginName: string; 
  avatarUrl: string | null;
}

export default class NotificationRepository {
  public prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async sendPushNotification(userId: number, message: string) {
    const tokens = await this.prisma.tokenNotification.findMany({
      where: { userId },
      select: { token: true },
    });

    const validTokens = tokens.map((t) => t.token).filter(Boolean);

    if (validTokens.length === 0) {
      console.log(`Không có token hợp lệ cho user ${userId}`);
      return;
    }

    const payload: MulticastMessage = {
      notification: {
        title: "Thông báo mới!",
        body: message,
      },
      tokens: validTokens,
    };

    return await firebaseAdmin.messaging().sendEachForMulticast(payload);
  }

  async sendPushNotificationMany(listUser: ListUserChannel[],contentTitle: string, message: string) {
    listUser.map(async(user) => {
      const tokens = await this.prisma.tokenNotification.findMany({
        where: { userId: user.id },
        select: { token: true },
      });
  
      const validTokens = tokens.map((t) => t.token).filter(Boolean);
  
      if (validTokens.length === 0) {
        console.log(`Không có token hợp lệ cho user ${user.id}`);
        return;
      }
  
      const payload: MulticastMessage = {
        notification: {
          title: contentTitle,
          body: message,
        },
        tokens: validTokens,
      };
  
      return await firebaseAdmin.messaging().sendEachForMulticast(payload);
    })
  }
  async createNotification(data: NotificationCreateInput) {
    const notification = await this.prisma.notification.create({
      data,
    });
    await this.sendPushNotification(data.userId, data.message);
    return notification;
  }

  async countUnreadNotifications(userId: number) {
    return await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }
  async markAsRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async createTokenNotification(userId: number, token: string) {
    // Check if token already exists
    const existingToken = await this.prisma.tokenNotification.findUnique({
      where: { token },
    });

    if (existingToken) {
      // If token exists, update the userId if it's different
      if (existingToken.userId !== userId) {
        return await this.prisma.tokenNotification.update({
          where: { token },
          data: { userId },
        });
      }
      return existingToken;
    }

    // If token doesn't exist, create new one
    return await this.prisma.tokenNotification.create({
      data: {
        userId,
        token,
      },
    });
  }
}
