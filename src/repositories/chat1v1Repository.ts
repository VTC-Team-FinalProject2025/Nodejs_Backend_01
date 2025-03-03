import { PrismaClient } from "@prisma/client";

export default class Chat1v1Repository {
  public prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async saveMessage(senderId: number, receiverId: number, content: string) {
    return this.prisma.direct_message.create({
      data: { senderId, receiverId, content },
    });
  }

  async getMessages(senderId: number, receiverId: number) {
    return this.prisma.direct_message.findMany({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
      orderBy: { createdAt: "asc" },
      include: {
        Sender: {
          select: {
            firstName: true,
            lastName: true,
            loginName: true,
            avatarUrl: true,
          },
        },
        Receiver: {
          select: {
            firstName: true,
            lastName: true,
            loginName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  // Đánh dấu tin nhắn đã đọc (nếu cần)
  async markMessagesAsRead(userId: number) {
    return this.prisma.direct_message.updateMany({
      where: { receiverId: userId },
      data: { editedAt: new Date() }, // Có thể dùng trường khác để đánh dấu đã đọc
    });
  }
}