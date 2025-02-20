import { PrismaClient } from "@prisma/client";

type Server = {
    id: number;
    name: string;
    ownerId: number;
    createdAt?: Date;
    updatedAt?: Date;
};

export default class ServerRepository {
    private prisma : PrismaClient;
    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }
    createServer = async (name: string, ownerId: number) => {
        return this.prisma.server.create({
            data: {
                name,
                ownerId
            }
        });
    }
    updateServer = async (id: number, name: string) => {
        return this.prisma.server.update({
            where: {
                id
            },
            data: {
                name
            }
        });
    }
    getServerById = async (id: number) => {
        return this.prisma.server.findUnique({
            where: {
                id
            },
            include: {
                Members: {
                    include: {
                        User: true,
                        Role: true
                    }
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
        return this.prisma.server.findMany({
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
        return this.prisma.server.delete({
            where: {
                id
            }
        });
    }
}