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

  async getAllFriends(
    filterCondition: any,
    includeFields: any,
    limit: number,
    page: number
  ) {
    return await this.prisma.friendship.findMany({
      where: {
        status: "accepted",
        ...filterCondition
      },
      include: includeFields,
      take: limit,
      skip: (page - 1) * limit,
    });
  }

  async getOnlineFriends(
    userId: number,
    onlineUserIds: Set<number>,
    includeFields: any
  ) {
    return await this.prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [
          { senderId: { in: Array.from(onlineUserIds) }, receiverId: userId},
          { receiverId: { in: Array.from(onlineUserIds) }, senderId: userId},
        ],
      },
      include: includeFields
    });
  }

  async countFriends(filterCondition: any) {
    return await this.prisma.friendship.count({
      where: {
        status: "accepted",
        ...filterCondition
      },
    });
  }

  async listFriendUser(userId: number) {
    return await this.prisma.friendship.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      select: {
        senderId: true,
        receiverId: true,
        status: true,
      },
    });
  }

  async suggestedFriends(friendIds: number[]) {
    return await this.prisma.friendship.findMany({
      where: {
        OR: friendIds.map((id: number) => ({
          OR: [
            { senderId: id, status: { in: ["accepted"] } },
            { receiverId: id, status: { in: ["accepted"] } },
          ],
        })),
      },
      select: {
        senderId: true,
        receiverId: true,
      },
    });
  }

  async getMutualFriendsCount(userId: number, suggestedUserId: number) {
    const userFriends = await this.listFriendUser(userId);
    const userFriendIds = userFriends.map((f) =>
      f.senderId === userId ? f.receiverId : f.senderId,
    );

    const suggestedUserFriends = await this.listFriendUser(suggestedUserId);
    const suggestedUserFriendIds = suggestedUserFriends.map((f) =>
      f.senderId === suggestedUserId ? f.receiverId : f.senderId,
    );

    // Tìm ID của bạn chung
    const mutualFriendIds = userFriendIds.filter(id => 
      suggestedUserFriendIds.includes(id) && id !== userId && id !== suggestedUserId
    );

    // Lấy thông tin chi tiết của bạn chung (giới hạn 5 người)
    const mutualFriends = await this.prisma.users.findMany({
      where: {
        id: {
          in: mutualFriendIds.slice(0, 5)
        }
      },
      select: {
        id: true,
        loginName: true,
        avatarUrl: true
      }
    });

    return {
      count: mutualFriendIds.length,
      friends: mutualFriends
    };
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

  async getTotalPendingFriendRequests(userId: number) {
    return await this.prisma.friendship.count({
      where: {
        receiverId: userId,
        status: "pending"
      }
    });
  }

  async getTotalSuggestedFriends(userId: number) {
    const friends = await this.listFriendUser(userId);
    const friendIds = friends.map((f) =>
      f.senderId === userId ? f.receiverId : f.senderId,
    );

    const suggestedFriends = await this.suggestedFriends(friendIds);
    const suggestedFriendIds = new Set();
    
    suggestedFriends.forEach((f) => {
      if (f.senderId !== userId && !friendIds.includes(f.senderId)) {
        suggestedFriendIds.add(f.senderId);
      }
      if (f.receiverId !== userId && !friendIds.includes(f.receiverId)) {
        suggestedFriendIds.add(f.receiverId);
      }
    });

    return suggestedFriendIds.size;
  }
}
