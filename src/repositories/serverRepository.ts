import { PrismaClient } from "@prisma/client";
import Random from "../helpers/Random";

export default class ServerRepository {
    private prisma: PrismaClient;
    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }
    createServer = async (name: string, ownerId: number, iconUrl: string) => {
        return await this.prisma.$transaction(async (px) => {
            let server = await px.server.create({
                data: {
                    name,
                    ownerId,
                    iconUrl
                }
            });
            let channels = px.channel.createMany({
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
            let roleOwner = px.role.create({
                data: {
                    name: "Owner",
                    color: "red",
                    serverId: server.id
                }
            });
            let roleMember = px.role.create({
                data: {
                    name: "Member",
                    color: "green",
                    serverId: server.id
                }
            });
            let inviteLink = this.generateInviteToken({ serverId: server.id });
            let result = await Promise.all([channels, roleOwner, roleMember]);
            let memberShip = await px.server_member.create({
                data: {
                    userId: ownerId,
                    serverId: server.id,
                    roleId: result[1].id
                }
            });
            return { server };
        });
    }
    updateServer = async (id: number, name: string, iconUrl?: string) => {
        return await this.prisma.server.update({
            where: {
                id
            },
            data: {
                name,
                iconUrl
            }
        });
    }
    getServerById = async (id: number) => {
        return await this.prisma.server.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                createdAt: true,
                ownerId: true,
                iconUrl: true,
                Members: {
                    take: 20,
                    include: {
                        User: {
                            select: {
                                id: true,
                                loginName: true,
                                avatarUrl: true,
                            },
                        },
                        Role: {
                            select: {
                                id: true,
                                name: true,
                                color: true,
                            },
                        },
                    },
                },
                Roles: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                        RolePermissions: {
                            select: {
                                Permission: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                InviteLink: {
                    select: {
                        id: true,
                        token: true,
                        createdAt: true,
                        expireAt: true,
                    },
                },
            },
        });
    }
    getServersByUserId = async (userId: number) => {
        const servers = await this.prisma.server.findMany({
            where: {
                Members: {
                    some: {
                        userId: userId
                    }
                }
            }
        });
        return servers;
    };
    deleteServer = async (id: number) => {
        return await this.prisma.server.delete({
            where: {
                id
            }
        });
    }
    getServerByInviteToken = async (inviteToken: string) => {
        return await this.prisma.server.findFirst({
            where: {
                InviteLink: {
                    token: inviteToken,
                    expireAt: {
                        gte: new Date(),
                    },
                    count: {
                        not: 0
                    },
                }
            },
            include: {
                InviteLink: true,
                Owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        loginName: true,
                        avatarUrl: true,
                    }
                },
                _count: {
                    select: {
                        Members: true,
                    },
                }
            }
        });
    }
    generateInviteToken = async (data: { serverId: number, count?: number, expireIn?: number }) => {
        let token;
        let isUnique = false;

        // Lặp đến khi tạo token không trùng
        while (!isUnique) {
            token = Random.generateToken(10); // Tạo token dài 10 ký tự
            // Kiểm tra token đã tồn tại trong DB chưa
            const existingToken = await this.prisma.inviteLink.findUnique({
                where: { token }
            });

            if (!existingToken) {
                isUnique = true;
            }
        }
        if (!token) throw new Error("Failed to generate token");
        // Tạo InviteLink mới count số lương có thể tham gia
        const oneDay = 24 * 60 * 60 * 1000;
        const inviteLink = await this.prisma.inviteLink.create({
            data: {
                serverId: data.serverId,
                count: (data.count ? data.count : -1),
                expireAt: new Date(Date.now() + (data.expireIn ? data.expireIn * oneDay : 7 * oneDay)), // Hết hạn sau 7 ngày
                token
            }
        });

        return inviteLink;
    }
    deleteInviteToken = async (serverId: number) => {
        return await this.prisma.inviteLink.delete({
            where: {
                serverId
            }
        });
    }
    getInviteToken = async (serverId: number, getValidToken: boolean = false) => {
        return await this.prisma.inviteLink.findFirst({
            where: getValidToken ? {
                serverId,
                count: {
                    not: 0
                },
                expireAt: {
                    gte: new Date(),
                }
            } : {
                serverId: serverId
            }
        });
    }
    updateInviteToken = async (data: { serverId: number, count: number }) => {
        return await this.prisma.inviteLink.update({
            where: {
                serverId: data.serverId
            },
            data: {
                count: data.count
            }
        }
        );
    }
    joinServer = async (data: { userId: number, serverId: number }) => {
        const existingMember = await this.existingMember(data);
        if (existingMember) throw new Error("User is already a member of this server");
        const role = await this.prisma.role.findFirst({
            where: {
                serverId: data.serverId,
                name: "Member"
            }
        })
        if (!role) throw new Error("Role not found in server");
        let result = await this.prisma.$transaction(async (px) => {
            let inviteLink = await px.inviteLink.findFirst({
                where: {
                    serverId: data.serverId,
                    count: {
                        not: 0
                    },
                    expireAt: {
                        gte: new Date(),
                    }
                }
            });
            if (!inviteLink) throw new Error("Invite link not found or expired");
            let decreaseCount;
            if (inviteLink.count > 0) {
                decreaseCount = px.inviteLink.update({
                    where: {
                        id: inviteLink.id
                    },
                    data: {
                        count: inviteLink.count - 1
                    }
                });
            }
            let createrMemberShip = await this.prisma.server_member.create({
                data: {
                    userId: data.userId,
                    serverId: data.serverId,
                    roleId: role.id
                }
            });
            const result = await Promise.all([decreaseCount, createrMemberShip]);
            return { memberShip: result[1] };
        });
        return result?.memberShip;
    }
    leaveServer = async (userId: number, serverId: number) => {
        return await this.prisma.server_member.delete({
            where: {
                serverId_userId: {
                    serverId,
                    userId
                }
            }
        });
    }
    existingMember = async (data: { userId: number, serverId: number }) => {
        const existingMember = await this.prisma.server_member.findFirst({
            where: {
                serverId: data.serverId,
                userId: data.userId
            }
        })
        return existingMember;
    }
}