import { PrismaClient, FriendshipStatus } from "@prisma/client";

type FriendShipCreateInput = {
  senderId: number;
  receiverId: number;
  status?: FriendshipStatus;
};

type FriendShipUpdateInput = {
  senderId?: number;
  receiverId?: number;
  status?: FriendshipStatus;
};

export default class FriendShipRepository {
  public prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  async createFriendShip(data: FriendShipCreateInput) {
    return await this.prisma.friendship.create({
      data,
    });
  }

  async existingFriendship(senderId: number, receiverId: number) {
    return await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });
  }

  async friendRequest(data: FriendShipUpdateInput) {
    return await this.prisma.friendship.findFirst({
      where: {
        senderId: Number(data.senderId),
        receiverId: Number(data.receiverId),
        status: data.status,
      },
    });
  }

  async findFriendship(data: FriendShipUpdateInput) {
    return await this.prisma.friendship.findFirst({
      where: {
        OR: [
          {
            senderId: Number(data.senderId),
            receiverId: Number(data.receiverId),
            status: data.status,
          },
          {
            senderId: Number(data.receiverId),
            receiverId: Number(data.senderId),
            status: data.status,
          },
        ],
      },
    });
  }

  async getFriendById(id: number) {
    return await this.prisma.friendship.findUnique({
      where: {
        id,
      },
    });
  }
  async updateFriendShipId(id: number, data: FriendShipUpdateInput) {
    return await this.prisma.friendship.update({
      where: {
        id,
      },
      data,
    });
  }

  async deleteFriendship(id: number) {
    return await this.prisma.friendship.delete({
      where: { id },
    });
  }

  async getOfflineFriends(
    onlineUserIds: Set<number>,
    filterCondition: any,
    includeFields: any,
    remainingLimit: number,
    offset: number,
    onlineFriendsCount: number
  ) {
    return await this.prisma.friendship.findMany({
      where: {
        ...filterCondition,
        status: "accepted",
        OR: [
          { senderId: { notIn: Array.from(onlineUserIds) } },
          { receiverId: { notIn: Array.from(onlineUserIds) } },
        ],
      },
      include: includeFields,
      take: remainingLimit,
      skip: Math.max(0, offset - onlineFriendsCount)
    });
  }

  async getOnlineFriends(
    onlineUserIds: Set<number>,
    filterCondition: any,
    includeFields: any,
    limit: number,
    offset: number
  ) {
    return await this.prisma.friendship.findMany({
      where: {
        ...filterCondition,
        status: "accepted",
        OR: [
          { senderId: { in: Array.from(onlineUserIds) } },
          { receiverId: { in: Array.from(onlineUserIds) } },
        ],
      },
      include: includeFields,
      take: limit,
      skip: offset,
    });
  }
}
