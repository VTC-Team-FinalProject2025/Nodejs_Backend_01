import { PrismaClient } from "@prisma/client";

export default class Chat1v1Repository {
  public prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async saveMessage(senderId: number, receiverId: number, content: string) {
    return this.prisma.direct_message.create({
      data: { senderId, receiverId, content },
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

  async getMessages(senderId: number, receiverId: number, page: number = 1, pageSize: number = 20) {
    return this.prisma.direct_message.findMany({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
      orderBy: { createdAt: "desc" }, 
      skip: (page - 1) * pageSize, 
      take: pageSize, 
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
      data: { editedAt: new Date(), isRead: true }, // Có thể dùng trường khác để đánh dấu đã đọc
    });
  }

  async ListRecentChats(userId: number, page: number = 1, pageSize: number = 20) {
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
  
    const latestMessages = await this.prisma.direct_message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: "desc" },
      distinct: ["senderId", "receiverId"],
      take: pageSize,
      select: {
        senderId: true,
        receiverId: true,
        content: true,
        isRead: true,
        createdAt: true,
      },
    });
  
    latestMessages.forEach((msg) => {
      const chatPartnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (uniqueUsers.has(chatPartnerId)) {
        uniqueUsers.get(chatPartnerId).latestMessage = msg.content;
        uniqueUsers.get(chatPartnerId).latestMessageRead = msg.isRead;
      }
    });
  
    return {
      users: Array.from(uniqueUsers.values()),
      totalUsers: uniqueUsers.size,
      totalPages: Math.ceil(uniqueUsers.size / pageSize),
      currentPage: page,
    };
  }
}