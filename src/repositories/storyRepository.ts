import { PrismaClient, ReactionType, StoryVisibility } from "@prisma/client";

export default class StoryRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ✅ Tạo story (có thể là PRIVATE, PUBLIC, CUSTOM)
  async createStoryWithCustomVisibility(data: {
    userId: number;
    mediaUrl?: string;
    visibility: StoryVisibility;
    allowedUserIds?: number[];
    image: string;
  }) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return this.prisma.story.create({
      data: {
        userId: data.userId,
        mediaUrl: data.mediaUrl,
        visibility: data.visibility,
        image: data.image,
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

    // Delete related records and story in a transaction
    return this.prisma.$transaction([
      this.prisma.storyView.deleteMany({ where: { storyId } }),
      this.prisma.storyReaction.deleteMany({ where: { storyId } }),
      this.prisma.story.delete({ where: { id: storyId } })
    ]);
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
            loginName: true,
            storyReactions: {
              where: { storyId },
              select: {
                type: true,
                reactedAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        viewedAt: "desc",
      },
    });
  }

  // ✅ Lấy danh sách story (bao gồm cả mình và bạn bè)
  async listStories(userId: number) {
    const now = new Date();

    const stories = await this.prisma.story.findMany({
      where: {
        expiresAt: { gt: now },
        OR: [
          { userId },
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
        createdAt: "asc",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            loginName: true,
          },
        },
        viewers: {
          where: { userId },
          select: { viewedAt: true },
        },
        allowedUsers: {
          select: {
            userId: true
          }
        }
      },
    });

    const grouped = new Map<number, any>();

    for (const story of stories) {
      const { user, allowedUsers, ...storyData } = story;
      if (!grouped.has(user.id)) {
        grouped.set(user.id, {
          user,
          stories: [],
        });
      }
      // Add allowedUserIds to story data if visibility is CUSTOM
      const storyWithAllowedUsers = {
        ...storyData,
        allowedUserIds: storyData.visibility === "CUSTOM" 
          ? allowedUsers.map(au => au.userId)
          : undefined
      };
      grouped.get(user.id).stories.push(storyWithAllowedUsers);
    }

    const groupedArray = Array.from(grouped.values());

    // 👉 Sắp xếp sao cho group của chính mình (userId) luôn đứng đầu
    groupedArray.sort((a, b) => {
      if (a.user.id === userId) return -1;
      if (b.user.id === userId) return 1;
      return 0;
    });

    return groupedArray;
  }

  async createReaction(storyId: number, userId: number, type: ReactionType) {
    return this.prisma.storyReaction.create({
      data: {
        storyId,
        userId,
        type,
      },
    });
  }

  // ✅ Update story visibility and allowed users
  async updateStoryVisibility(storyId: number, userId: number, data: {
    visibility: StoryVisibility;
    allowedUserIds?: number[];
  }) {
    // Check if story exists and user has permission
    const story = await this.prisma.story.findFirst({
      where: { id: storyId, userId },
    });

    if (!story) throw new Error("Story not found or permission denied");

    // Update story with new visibility and allowed users
    return this.prisma.story.update({
      where: { id: storyId },
      data: {
        visibility: data.visibility,
        allowedUsers: data.visibility === "CUSTOM" 
          ? {
              deleteMany: {}, // Remove all existing allowed users
              create: data.allowedUserIds?.map((id) => ({
                user: { connect: { id } },
              })),
            }
          : undefined,
      },
    });
  }
}
