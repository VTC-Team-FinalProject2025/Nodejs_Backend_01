import { PrismaClient, TypeStatusNotification } from "@prisma/client";

type NotificationCreateInput = {
    userId: number;
    message: string;
    type: TypeStatusNotification;
};

export default class FriendShipRepository {
  public prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  async createNotification(data: NotificationCreateInput) {
    return await this.prisma.notification.create({
      data,
    });
  }
}
