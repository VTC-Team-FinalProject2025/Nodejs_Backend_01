import { Request, Response, NextFunction } from "express";
import { BaseController } from "./abstractions/base-controller";
import RoleRepository from "../repositories/roleRepository";
import HttpException from "../exceptions/http-exception";
import { RoleSchema, RoleUpdateSchema } from "../schemas/role";
import ValidateSchema from "../middlewares/validateSchema.middleware";

export default class RoleController extends BaseController {
    private roleRepo: RoleRepository;

    constructor(roleRepo: RoleRepository) {
        super();
        this.roleRepo = roleRepo;
        this.path = "/roles";
        this.initializeRoutes();
    }

    public initializeRoutes() {
        this.router.post(`/`, ValidateSchema(RoleSchema), this.createRole);
        this.router.get(`/:id`, this.getRoleById);
        this.router.get(`/`, this.getRoles);
        this.router.put(`/:id`, ValidateSchema(RoleUpdateSchema), this.updateRole);
        this.router.delete(`/:id`, this.deleteRole);
        this.router.post(`/:roleId/permissions/:permissionId`, this.assignPermissionToRole);
        this.router.delete(`/:roleId/permissions/:permissionId`, this.removePermissionFromRole);
        this.router.get(`/:roleId/permissions`, this.getPermissionsOfRole);
        this.router.get(`/permissions/all`, this.getAllPermissions);
        this.router.post(`/assign`, this.assignRoleToMember);
    }

    // Tạo vai trò mới
    private createRole = async (req: Request, res: Response, next: NextFunction) => {
        const { serverId, name, color, permissions } = req.body;
        try {
            const role = await this.roleRepo.createRole({ serverId, name, color, permissions });
            res.status(201).json(role);
        } catch (error) {
            console.log(error);
            next(new HttpException(500, "Failed to create role"));
        }
    };

    // Lấy thông tin vai trò theo roleId
    private getRoleById = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;
        try {
            const role = await this.roleRepo.getRoleById(Number(id));
            if (!role) {
                return next(new HttpException(404, "Role not found"));
            }
            res.status(200).json(role);
        } catch (error) {
            next(new HttpException(500, "Failed to retrieve role"));
        }
    };

    // Lấy tất cả vai trò của một server
    private getRoles = async (req: Request, res: Response, next: NextFunction) => {
        const { serverId } = req.query;
        try {
            const roles = await this.roleRepo.getAllRoles(Number(serverId));
            res.status(200).json(roles);
        } catch (error) {
            next(new HttpException(500, "Failed to retrieve roles"));
        }
    };

    // Cập nhật vai trò
    private updateRole = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;
        const { name, color } = req.body;
        try {
            const role = await this.roleRepo.getRoleById(Number(id));
            if (!role) {
                return next(new HttpException(404, "Role not found"));
            }

            let updateData: { name?: string; color?: string } = {};

            if (role.name === "Owner" || role.name === "Member") {
                // Chỉ cho phép cập nhật color nếu là role mặc định
                updateData.color = color;
            } else {
                updateData = { name, color };
            }

            const updatedRole = await this.roleRepo.updateRole(Number(id), updateData);
            res.status(200).json(updatedRole);
        } catch (error) {
            next(new HttpException(500, "Failed to update role"));
        }
    };


    // Xoá vai trò
    private deleteRole = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;
        try {
            const role = await this.roleRepo.getRoleById(Number(id));
            if (!role) {
                return next(new HttpException(404, "Role not found"));
            }
            await this.roleRepo.deleteRole(role);
            res.status(200).json({ message: "Role deleted successfully" });
        } catch (error) {
            next(new HttpException(500, "Failed to delete role"));
        }
    };

    // Gán quyền cho vai trò
    private assignPermissionToRole = async (req: Request, res: Response, next: NextFunction) => {
        const { roleId, permissionId } = req.params;
        try {
            await this.roleRepo.assignPermissionToRole(Number(roleId), Number(permissionId));
            res.status(200).json({ message: "Permission assigned to role successfully" });
        } catch (error) {
            next(new HttpException(500, "Failed to assign permission"));
        }
    };

    // Xoá quyền khỏi vai trò
    private removePermissionFromRole = async (req: Request, res: Response, next: NextFunction) => {
        const { roleId, permissionId } = req.params;
        try {
            await this.roleRepo.removePermissionFromRole(Number(roleId), Number(permissionId));
            res.status(200).json({ message: "Permission removed from role successfully" });
        } catch (error) {
            next(new HttpException(500, "Failed to remove permission"));
        }
    };

    // Lấy các quyền của vai trò
    private getPermissionsOfRole = async (req: Request, res: Response, next: NextFunction) => {
        const { roleId } = req.params;
        try {
            const permissions = await this.roleRepo.getPermissionsOfRole(Number(roleId));
            res.status(200).json(permissions);
        } catch (error) {
            next(new HttpException(500, "Failed to get permissions of role"));
        }
    };

    private getAllPermissions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const permissions = await this.roleRepo.getAllPermissions();
            res.status(200).json(permissions);
        } catch (error) {
            next(new HttpException(500, "Failed to get all permissions"));
        }
    }

    // asign role to member
    private assignRoleToMember = async (req: Request, res: Response, next: NextFunction) => {
        const { roleId, memberId } = req.body;
        try {
            await this.roleRepo.assignRoleToMember(Number(roleId), Number(memberId));
            res.status(200).json({ message: "Role assigned to member successfully" });
        } catch (error) {
            next(new HttpException(500, "Failed to assign role to member"));
        }
    }
}
