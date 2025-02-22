import { PrismaClient } from "@prisma/client";

export default class ServerRepository {
    private prisma : PrismaClient;
    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }
    createServer = async (name: string, ownerId: number) => {
        return await this.prisma.$transaction(async (px) => {
            let server = await px.server.create({
                data: {
                    name,
                    ownerId
                }
            });
            let channels = await px.channel.createMany({
                data: [
                    {
                        name: "General",
                        type: "chat",
                        serverId: server.id
                    },
                    {
                        name: "Voice",
                        type: "meet",
                        serverId: server.id
                    }
                ]
            });
            let role = px.role.create({
                data: {
                    name: "Owner",
                    color: "red",
                    serverId: server.id
                }
            });
            let result = await Promise.all([channels, role]);
            let memberShip = await px.server_member.create({
                data: {
                    userId: ownerId,
                    serverId: server.id,
                    roleId: result[1].id
                }
            });
            return {server, channels};
        });
    }
    updateServer = async (id: number, name: string) => {
        return await this.prisma.server.update({
            where: {
                id
            },
            data: {
                name
            }
        });
    }
    getServerById = async (id: number) => {
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
                        Role: {
                            select: {
                                id: true,
                                name: true,
                                color: true,
                            }
                        },
                    },
                },
                Channels: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        createdAt: true,
                    }
                },
                Roles: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                    }
                }
            }
        });
    }
    getServersByUserId = async (userId: number) => {
        return await this.prisma.server.findMany({
            where: {
                Members: {
                    some: {
                        userId: userId
                    },
                }
            }
        });
    }
    deleteServer = async (id: number) => {
        return await this.prisma.server.delete({
            where: {
                id
            }
        });
    }
}