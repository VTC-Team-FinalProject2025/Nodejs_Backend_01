import { PrismaClient, Role } from "@prisma/client";

type CreateRoleInput = {
    serverId: number;
    name: string;
    color: string;
    permissions: number[];
};

export default class RoleRepository {
    public prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    // Tạo vai trò mới
    async createRole(data: CreateRoleInput): Promise<Role> {
        const { serverId, name, color, permissions } = data;

        // Tạo vai trò mới
        const role = await this.prisma.role.create({
            data: {
                serverId,
                name,
                color,
                RolePermissions: {
                    create: permissions.map((permissionId) => ({
                        permissionId,  // Kết nối Role với Permission qua bảng Role_permission
                    })),
                },
            },
            include: {
                RolePermissions: {
                    include: {
                        Permission: true, // Đảm bảo trả về các permissions liên kết
                    },
                },
            },
        });

        return role;
    }



    // Lấy thông tin vai trò theo roleId
    async getRoleById(roleId: number): Promise<Role | null> {
        const role = await this.prisma.role.findUnique({
            where: { id: roleId },
            include: {
                RolePermissions: {
                    include: {
                        Permission: true,
                    },
                },
            }
        });
        return role;
    }

    // Lấy tất cả vai trò của một server
    async getAllRoles(serverId: number): Promise<Role[]> {
        const roles = await this.prisma.role.findMany({
            where: { serverId },
            include: {
                RolePermissions: {
                    include: {
                        Permission: true,
                    },
                },
            },
        });
        return roles;
    }

    // Cập nhật thông tin vai trò
    async updateRole(roleId: number, data: Partial<CreateRoleInput>): Promise<Role> {
        const updatedRole = await this.prisma.role.update({
            where: { id: roleId },
            data,
            include: {
                RolePermissions: {
                    include: {
                        Permission: true,
                    },
                },
            },
        });
        return updatedRole;
    }

    // Xoá vai trò
    async deleteRole(roleId: number): Promise<Role> {
        const deletedRole = await this.prisma.role.delete({
            where: { id: roleId },
        });
        return deletedRole;
    }

    // Gán quyền cho vai trò
    async assignPermissionToRole(roleId: number, permissionId: number): Promise<void> {
        const existingRolePermission = await this.prisma.role_permission.findFirst({
            where: {
                roleId,
                permissionId,
            },
        });

        if (existingRolePermission) {
            console.log('Vai trò này đã có quyền này.');
            return;
        }

        await this.prisma.role_permission.create({
            data: {
                roleId,
                permissionId,
            },
        });
    }

    // Xoá quyền khỏi vai trò
    async removePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
        await this.prisma.role_permission.deleteMany({
            where: {
                roleId,
                permissionId,
            },
        });
    }

    // get permissions of a role
    async getPermissionsOfRole(roleId: number): Promise<string[]> {
        const permissions = await this.prisma.role_permission.findMany({
            where: { roleId },
            select: { Permission: { select: { name: true } } },
        });

        return permissions.map((p) => p.Permission.name);
    }

    // get all permissions
    async getAllPermissions() {
        const permissions = await this.prisma.permission.findMany({
            select: { name: true, id: true, description: true },
        });
        return permissions;
    }

}
