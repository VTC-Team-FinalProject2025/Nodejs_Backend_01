import { PrismaClient } from "@prisma/client";

type UserCreateInput = {
  firstName: string;
  lastName: string;
  loginName: string;
  email: string;
  phone?: string;
  password: string;
  status?: boolean;
  githubId?: string;
  isEmailVertify?: boolean;
};

type UserUpdateInput = {
  firstName?: string;
  lastName?: string;
  loginName?: string;
  // email?: string;
  // phone?: string;
  password?: string;
  status?: boolean;
  isEmailVertify?: boolean;
  updatedAt?: Date;
};

export default class UserRepository {
  public prisma: PrismaClient;
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  async createUser(data: UserCreateInput) {
    return await this.prisma.users.create({
      data,
    });
  }
  async getUserByEmail(email: string) {
    return await this.prisma.users.findUnique({
      where: {
        email,
      },
    });
  }
  async getUserByGithubId(githubId: string) {
    return await this.prisma.users.findUnique({
      where: { githubId: githubId },
    });
  }
  async getUserByPhone(phone: string) {
    return await this.prisma.users.findUnique({
      where: {
        phone,
      },
    });
  }
  async getUserByLoginName(name: string) {
    return await this.prisma.users.findUnique({
      where: {
        loginName: name,
      },
    });
  }
  async getUserById(id: number) {
    return await this.prisma.users.findUnique({
      where: {
        id,
      },
    });
  }
  async getUserInformationById(id: number) {
    return await this.prisma.users.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        loginName: true,
        avatarUrl: true,
        createdAt: true
      },
    });
  }
  async updateUser(id: number, data: UserUpdateInput) {
    return await this.prisma.users.update({
      where: {
        id,
      },
      data,
    });
  }

  async filterUserListArray(
    suggestedFriendIds: any,
    page: number,
    limit: number,
  ) {
    return await this.prisma.users.findMany({
      where: { id: { in: Array.from(suggestedFriendIds) } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        loginName: true,
        avatarUrl: true,
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async totalUsersArray(suggestedFriendIds: any) {
    return await this.prisma.users.count({
      where: { id: { in: Array.from(suggestedFriendIds) } },
    });
  }

  async findUsersExcludedUserIds(
    query: string,
    excludedUserIds: number[],
    page: number,
    limit: number,
  ) {
    return await this.prisma.users.findMany({
      where: {
        id: { notIn: excludedUserIds },
        OR: [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
          { loginName: { contains: query }},
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        loginName: true,
        avatarUrl: true,
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async countUsersExcludedUserIds(query: string, excludedUserIds: number[]) {
    return await this.prisma.users.count({
      where: {
        id: { notIn: excludedUserIds },
        OR: [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
          { loginName: { contains: query } },
        ],
      },
    });
  }
}
