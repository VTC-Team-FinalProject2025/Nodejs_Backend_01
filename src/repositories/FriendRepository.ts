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
      include: {
        sender: { select: { id: true, loginName: true, avatarUrl: true } },
        receiver: { select: { id: true, loginName: true, avatarUrl: true } },
      },
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
      include: {
        sender: { select: { id: true, loginName: true, avatarUrl: true } },
        receiver: { select: { id: true, loginName: true, avatarUrl: true } },
      },
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
    onlineFriendsCount: number,
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
      skip: Math.max(0, offset - onlineFriendsCount),
    });
  }

  async getOnlineFriends(
    onlineUserIds: Set<number>,
    filterCondition: any,
    includeFields: any,
    limit: number,
    offset: number,
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

  async listFriendUser(userId: number) {
    return await this.prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, status: "accepted" },
          { receiverId: userId, status: "accepted" },
        ],
      },
      select: {
        senderId: true,
        receiverId: true,
      },
    });
  }

  async suggestedFriends(friendIds: number[]) {
    return await this.prisma.friendship.findMany({
      where: {
        OR: friendIds.map((id: number) => ({
          OR: [
            { senderId: id, status: "accepted" },
            { receiverId: id, status: "accepted" },
          ],
        })),
      },
      select: {
        senderId: true,
        receiverId: true,
      },
    });
  }

  async getExcludedUsers(userId: number) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          {
            senderId: userId,
            status: { in: ["accepted", "pending", "blocked"] },
          },
          {
            receiverId: userId,
            status: { in: ["accepted", "pending", "blocked"] },
          },
        ],
      },
      select: {
        senderId: true,
        receiverId: true,
      },
    });
    const excludedUserIds = new Set<number>([userId]);
    friendships.forEach((f) => {
      if (f.senderId !== userId) excludedUserIds.add(f.senderId);
      if (f.receiverId !== userId) excludedUserIds.add(f.receiverId);
    });

    return Array.from(excludedUserIds);
  }
}
