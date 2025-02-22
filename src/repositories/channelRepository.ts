import { PrismaClient } from "@prisma/client";

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

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
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
    return this.prisma.channel.findMany({
      where: { serverId },
    });
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
} 
