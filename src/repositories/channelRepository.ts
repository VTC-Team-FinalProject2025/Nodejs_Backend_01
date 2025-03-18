import { PrismaClient } from "@prisma/client";
import { Database } from "firebase-admin/database";

type ChannelCreate = {
  serverId: number;
  name: string;
  type: "meet" | "chat";
  password?: string;
}
type ChannelUpdate = {
  id: number;
  name: string;
  password?: string;
}
export default class ChannelRepository {
  private prisma: PrismaClient;
  private readonly db: Database;
  constructor(prisma: PrismaClient, db: Database) {
    this.prisma = prisma;
    this.db = db;
  }

  // Create a new channel
  createChannel = async (data: ChannelCreate) => {
    return this.prisma.channel.create({
      data
    });
  };

  getChannelById = async (id: number, cursor?: { createdAt: Date; id: number }, take: number = 10, orderBy: "asc" | "desc" = "desc") => {
    const channel = await this.prisma.channel.findUnique({
      where: { id },
      include: { Server: true }
    });

    if (!channel) return null;

    const messages = await this.prisma.message.findMany({
      where: { channelId: id },
      take,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { createdAt: cursor.createdAt, id: cursor.id } : undefined,
      orderBy: [
        { createdAt: orderBy },
        { id: orderBy }
      ]
    });

    return { ...channel, Messages: messages };
  };

  // Get all channels for a specific server
  getChannelsByServerId = async (serverId: number) => {
    const channels = await this.prisma.channel.findMany({
      where: { serverId },
      select: {
        id: true,
        name: true,
        type: true,
        password: true
      }
    });
    return await this.getAllChannelsWithParticipants(channels);
  };

  // Update a channel
  updateChannel = async (data: ChannelUpdate) => {
    return this.prisma.channel.update({
      where: { id: data.id },
      data
    });
  };

  // Delete a channel
  deleteChannel = async (id: number) => {
    return this.prisma.channel.delete({
      where: { id }
    });
  };

  private getAllChannelsWithParticipants = async (channels: any[]) => {
    const channelsTypeMeeting = channels.filter((channel) => channel.type === "meet");
    const channelsTypeChat = channels.filter((channel) => channel.type === "chat");
    const promises: Promise<any>[] = [];
    channelsTypeMeeting.forEach(async (channel) => {
      const promise = this.getChannelParticipants(String(channel.id));
      promises.push(promise);
    });

    const participants = await Promise.all(promises);
    let channelWithParticipants = channelsTypeMeeting.map((channel, index) => {
      return {
        ...channel,
        participants: participants[index],
      };
    })

    return [...channelWithParticipants, ...channelsTypeChat];
  }

  getChannelParticipants = async (channelId: string) => {
    const participantsSnapshot = await this.db.ref(`channels/${channelId}/participants`).once("value");
    return participantsSnapshot.val();
  }

  handleRemoveUserFromChannel = async ({ userId, callback }: { userId: string, callback: (channelId: string) => void }) => {
    // Lấy danh sách tất cả các channels mà user đang tham gia
    const userChannelsSnapshot = await this.db.ref(`users/${userId}/channels`).once("value");
    const userChannels = userChannelsSnapshot.val();

    if (userChannels) {
      for (const channelId of Object.keys(userChannels)) {
        callback(channelId);
        await this.db.ref(`channels/${channelId}/participants/${userId}`).remove();
      }
    }
  }
} 
