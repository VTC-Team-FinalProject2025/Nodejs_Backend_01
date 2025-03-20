import { PrismaClient } from "@prisma/client";

export default class ChatChannelRepository {
  public prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async saveMessage(senderId: number,channelId: number, content: string) {
    return this.prisma.message.create({
      data: { senderId,channelId, content },
      include: {
        Sender: {
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

  async getMessages(
    channelId: number,
    page: number = 1,
    pageSize: number = 20,
  ) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { channelId },
        ],
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        Sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            loginName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async markMessagesAsRead(userId: number, receiverId: number) {
    return this.prisma.direct_message.updateMany({
      where: {
        senderId: receiverId,
        receiverId: userId,
        isRead: false
      },
      data: { editedAt: new Date(), isRead: true },
    });
  }

  async ListRecentChats(
    userId: number,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const skip = (page - 1) * pageSize;

    // Lấy danh sách các cuộc trò chuyện gần đây
    const recentChats = await this.prisma.direct_message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: "desc" },
      distinct: ["senderId", "receiverId"],
      skip,
      take: pageSize,
      include: {
        Sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            loginName: true,
            avatarUrl: true,
          },
        },
        Receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            loginName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const uniqueUsers = new Map<number, any>();

    for (const msg of recentChats) {
      const chatPartner = msg.senderId === userId ? msg.Receiver : msg.Sender;
      if (!chatPartner) continue;

      if (!uniqueUsers.has(chatPartner.id)) {
        uniqueUsers.set(chatPartner.id, {
          ...chatPartner,
          unreadCount: 0,
          latestMessage: null,
          latestMessageRead: true,
          latestMessageSenderId: null,
        });
      }
    }

    const unreadCounts = await this.prisma.direct_message.groupBy({
      by: ["senderId"],
      where: {
        receiverId: userId,
        isRead: false,
      },
      _count: {
        _all: true,
      },
    });

    unreadCounts.forEach((unread) => {
      if (uniqueUsers.has(unread.senderId)) {
        uniqueUsers.get(unread.senderId).unreadCount = unread._count._all;
      }
    });

    const latestMessages = await Promise.all(
      Array.from(uniqueUsers.keys()).map(async (chatPartnerId) => {
        return this.prisma.direct_message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: chatPartnerId },
              { senderId: chatPartnerId, receiverId: userId },
            ],
          },
          orderBy: { createdAt: "desc" },
          select: {
            senderId: true,
            receiverId: true,
            content: true,
            isRead: true,
            createdAt: true,
          },
        });
      }),
    );

    latestMessages.forEach((msg) => {
      if (msg) {
        const chatPartnerId =
          msg.senderId === userId ? msg.receiverId : msg.senderId;
        if (uniqueUsers.has(chatPartnerId)) {
          uniqueUsers.get(chatPartnerId).latestMessage = msg.content;
          uniqueUsers.get(chatPartnerId).latestMessageRead = msg.isRead;
          uniqueUsers.get(chatPartnerId).latestMessageSenderId = msg.senderId;
        }
      }
    });

    return {
      users: Array.from(uniqueUsers.values()),
      totalUsers: uniqueUsers.size,
      totalPages: Math.ceil(uniqueUsers.size / pageSize),
      currentPage: page,
    };
  }

  async updateMessageContent(messageId: number, newContent: string) {
    return await this.prisma.direct_message.update({
      where: { id: messageId },
      data: { content: newContent, editedAt: new Date() },
    });
  }

  async deleteMessageById(messageId: number) {
    return await this.prisma.direct_message.delete({
      where: { id: messageId },
    });
  }

  async getMessageById(messageId: number, channelId: number) {
    return await this.prisma.message.findFirst({
      where: { 
        id: messageId,
        channelId: channelId  
      },
    });
  }
}
