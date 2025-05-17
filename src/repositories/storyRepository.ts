import { PrismaClient } from "@prisma/client";

export default class StoryRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ✅ Tạo story (có thể là PRIVATE, PUBLIC, CUSTOM)
  async createStoryWithCustomVisibility(data: {
    userId: number;
    content: string;
    mediaUrl?: string;
    visibility: "PUBLIC" | "PRIVATE" | "CUSTOM";
    allowedUserIds?: number[];
  }) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return this.prisma.story.create({
      data: {
        userId: data.userId,
        mediaUrl: data.mediaUrl,
        visibility: data.visibility,
        expiresAt,
        allowedUsers:
          data.visibility === "CUSTOM"
            ? {
                create: data.allowedUserIds?.map((id) => ({
                  user: { connect: { id } },
                })),
              }
            : undefined,
      },
    });
  }

  // ✅ Xoá story (chỉ người tạo mới được xoá)
  async deleteStoryById(storyId: number, userId: number) {
    // check quyền
    const story = await this.prisma.story.findFirst({
      where: { id: storyId, userId },
    });

    if (!story) throw new Error("Story not found or permission denied");

    return this.prisma.story.delete({
      where: { id: storyId },
    });
  }

  // ✅ Ghi lại lượt xem story
  async markStoryAsViewed(storyId: number, userId: number) {
    return this.prisma.storyView.upsert({
      where: {
        storyId_userId: {
          storyId,
          userId,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        storyId,
        userId,
      },
    });
  }

  // ✅ Lấy danh sách đã xem story
  async getStoryViews(storyId: number) {
    return this.prisma.storyView.findMany({
      where: { storyId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        viewedAt: "desc",
      },
    });
  }

  // ✅ Lấy danh sách story (bao gồm cả mình và bạn bè)
  async listStories(userId: number, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const now = new Date();

    return this.prisma.story.findMany({
      where: {
        expiresAt: { gt: now },
        OR: [
          { userId }, // story chính mình

          // story PUBLIC từ bạn bè
          {
            visibility: "PUBLIC",
            user: {
              OR: [
                {
                  friendships: {
                    some: {
                      receiverId: userId,
                      status: "accepted",
                    },
                  },
                },
                {
                  friendOf: {
                    some: {
                      senderId: userId,
                      status: "accepted",
                    },
                  },
                },
              ],
            },
          },

          // story CUSTOM được phép xem
          {
            visibility: "CUSTOM",
            allowedUsers: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        viewers: {
          where: { userId },
          select: { viewedAt: true },
        },
      },
    });
  }
}