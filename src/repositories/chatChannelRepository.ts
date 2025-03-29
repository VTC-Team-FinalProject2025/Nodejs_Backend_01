import { PrismaClient } from "@prisma/client";
import { decrypt } from "../helpers/Encryption";

export default class ChatChannelRepository {
  public prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async saveMessage(senderId: number, channelId: number, content: string) {
    return this.prisma.message.create({
      data: { senderId, channelId, content },
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
        Readers: {
          select: {
            userId: true,
            messageId: true,
            readAt: true,
            User: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                loginName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async getMessages(
    channelId: number,
    page: number = 1,
    pageSize: number = 20,
    userId: number,
  ) {
    const messages = await this.prisma.message.findMany({
      where: {
        channelId,
        NOT: {
          HiddenMessages: {
            some: { userId },
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
        Readers: {
          select: {
            userId: true,
            messageId: true,
            readAt: true,
            User: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                loginName: true,
                avatarUrl: true,
              },
            },
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

  

  async markMessagesAsRead(userId: number, messageId: number) {
    return this.prisma.messageReadChannel.upsert({
      where: {
        userId_messageId: {
          userId,
          messageId,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        userId,
        messageId,
      },
      select: {
        messageId: true,
        User: {
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

  async isMessageRead(userId: number, messageId: number): Promise<boolean> {
    const record = await this.prisma.messageReadChannel.findUnique({
      where: {
        userId_messageId: {
          userId,
          messageId,
        },
      },
    });

    return !!record;
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
    await this.prisma.$transaction([
      this.prisma.messageReadChannel.deleteMany({ where: { messageId } }),
      this.prisma.hidden_message_channel.deleteMany({ where: { messageId } }),
      this.prisma.icon_message_channel.deleteMany({ where: { messageId } }),
      this.prisma.reply_message_channel.deleteMany({ where: {  messageId } }),

      this.prisma.message.delete({ where: { id: messageId } }),
    ]);

    return { success: true };
  }

  async getMessageById(messageId: number) {
    return await this.prisma.message.findFirst({
      where: {
        id: messageId,
      },
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
        Readers: {
          select: {
            userId: true,
            messageId: true,
            readAt: true,
            User: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                loginName: true,
                avatarUrl: true,
              },
            },
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
  }

  getDetailChannelById = async (id: number) => {
    return await this.prisma.channel.findUnique({
      where: {
        id,
    },
    })
  }

  getListUserServerById = async (id: number) => {
    return await this.prisma.server.findUnique({
        where: {
            id
        },
        include: {
            Members: {
                include: {
                    User: {
                        select: {
                            id: true,
                            loginName: true,
                            avatarUrl: true,
                        }
                    },
                },
            },
        }
    });
  }
  async SaveHiddenMessage(userId: number, messageId: number) {
    return await this.prisma.hidden_message_channel.create({
      data: { userId, messageId },
    });
  }

  async SaveIconMessage(userId: number, messageId: number, icon: string) {
    return await this.prisma.icon_message_channel.create({
      data: { userId, messageId, icon },
    });
  }
  async GetIconMessageId(id: number) {
    return await this.prisma.icon_message_channel.findUnique({
      where: { id },
    });
  }

  async DeleteIconMessageById(id: number) {
    return await this.prisma.icon_message_channel.delete({
      where: { id },
    });
  }

  async UpdateIconMessage(userId: number, id: number, newIcon: string) {
    await this.prisma.icon_message_channel.updateMany({
      where: { id, userId },
      data: { icon: newIcon },
    });
  
    return await this.prisma.icon_message_channel.findFirst({
      where: { id, userId },
      select: {
        id: true,
        userId: true,
        icon: true,
        messageId: true,
      },
    });
  }
  async SaveReplyMessage(messageId: number, replyMessageId: number) {
    return await this.prisma.reply_message_channel.create({
      data: { messageId, replyMessageId },
    });
  }
}
