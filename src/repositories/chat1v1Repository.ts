import { PrismaClient } from "@prisma/client";
import { decrypt } from "../helpers/Encryption";

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

  async getMessages(
    senderId: number,
    receiverId: number,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const messages = await this.prisma.direct_message.findMany({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
        NOT: {
          HiddenMessages: {
            some: { userId: senderId },
          },
        },
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
        Receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            loginName: true,
            avatarUrl: true,
          },
        },
        RepliesReceived: {
          select: {
            replyMessageId: true,
            ReplyMessage: {
              select: {
                id: true,
                content: true,
                senderId: true,
              },
            },
          },
        },
        IconMessages: {
          select: {
            id: true,
            userId: true,
            messageId: true,
            icon: true,
          },
        },
      },
    });

    return messages.map((msg) => ({
      ...msg,
      content: decrypt(msg.content),
      RepliesReceived:
        msg.RepliesReceived.length > 0
          ? {
              replyMessageId: msg.RepliesReceived[0]?.replyMessageId ?? null,
              ReplyMessage: {
                id: msg.RepliesReceived[0]?.ReplyMessage?.id ?? null,
                content: msg.RepliesReceived[0]?.ReplyMessage?.content
                  ? decrypt(msg.RepliesReceived[0].ReplyMessage.content)
                  : null,
                senderId:
                  msg.RepliesReceived[0]?.ReplyMessage?.senderId ?? null,
              },
            }
          : null,
    }));
  }

  async markMessagesAsRead(userId: number, receiverId: number) {
    return this.prisma.direct_message.updateMany({
      where: {
        senderId: receiverId,
        receiverId: userId,
        isRead: false,
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
          uniqueUsers.get(chatPartnerId).latestMessage = decrypt(msg.content);
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

  async getMessageById(messageId: number) {
    return await this.prisma.direct_message.findUnique({
      where: { id: messageId },
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
        RepliesReceived: {
          select: {
            replyMessageId: true,
            ReplyMessage: {
              select: {
                id: true,
                content: true,
                senderId: true,
              },
            },
          },
        },
      },
    });
  }

  async SaveReplyMessage(messageId: number, replyMessageId: number) {
    return await this.prisma.reply_direct_message.create({
      data: { messageId, replyMessageId },
    });
  }

  async SaveHiddenMessage(userId: number, messageId: number) {
    return await this.prisma.hidden_direct_message.create({
      data: { userId, messageId },
    });
  }

  async SaveIconMessage(userId: number, messageId: number, icon: string) {
    return await this.prisma.icon_direct_message.create({
      data: { userId, messageId, icon },
    });
  }
  async GetIconMessageId(id: number) {
    return await this.prisma.icon_direct_message.findUnique({
      where: { id },
    });
  }

  async DeleteIconMessageById(id: number) {
    return await this.prisma.direct_message.delete({
      where: { id },
    });
  }
}
