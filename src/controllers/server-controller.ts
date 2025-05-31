import { PrismaClient } from "@prisma/client";
import authMiddleware from "../middlewares/authentication.middleware";
import ServerRepository from "../repositories/serverRepository";
import { BaseController } from "./abstractions/base-controller";
import { NextFunction, Request, Response } from "express";
import ChannelRepository from "../repositories/channelRepository";
import HttpException from "../exceptions/http-exception";
import { FileRepository } from "../repositories/fileRepository";
import multer from "multer";
import { CookieKeys, DEFAULT_SERVER_ICON } from "../constants";
import validateSchema from "../middlewares/validateSchema.middleware";
import { InviteLinkSchema } from "../schemas/server";
import CookieHelper from "../helpers/Cookie";
import JWT, { ServerAccessTokenPayload } from "../helpers/JWT";
import UserRepository from "../repositories/UserRepository";
import RoleRepository from "../repositories/roleRepository";
import NotificationRepository from "../repositories/notificationRepository";
import { cache } from "../middlewares/cache.middleware";
import { cacheHelper } from "../helpers/Cache";

export default class FileController extends BaseController {
  private serverRepo: ServerRepository;
  private channelRepo: ChannelRepository;
  private fileRepository: FileRepository;
  private userRepo: UserRepository;
  private roleRepository: RoleRepository;
  private notiRepo: NotificationRepository;
  private upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  constructor(serverRepo: ServerRepository, channelRepo: ChannelRepository, roleRepository: RoleRepository, prisma: PrismaClient, notiRepo: NotificationRepository) {
    super();
    this.serverRepo = serverRepo;
    this.channelRepo = channelRepo;
    this.roleRepository = roleRepository;
    this.fileRepository = new FileRepository();
    this.notiRepo = notiRepo;
    this.userRepo = new UserRepository(prisma);
    this.path = "/servers";
    this.initializeRoutes();
  }

  private getCachePattern(): string {
    return `/api/${this.path}*`;
  }

  private async clearServerCache(): Promise<void> {
    await cacheHelper.clearRelatedCache(this.getCachePattern());
  }

  public initializeRoutes() {
    this.router.use(authMiddleware);
    this.router.post(`/`, this.upload.single("icon"), this.createServer);
    this.router.get(`/:id`, cache, this.getServerById);
    this.router.get(`/`, cache, this.getServers);
    this.router.put(`/:id`, this.upload.single("icon"), this.updateServer);
    this.router.delete(`/:id`, this.deleteServer);
    this.router.post(`/join`, this.joinServer);
    this.router.post(`/leave/:id`, this.leaveServer);
    this.router.post(`/invite-token`, validateSchema(InviteLinkSchema), this.createInviteLink);
    this.router.get(`/invite-token/:token`, cache, this.getServerByInviteToken);
    this.router.post(`/kick`, this.kickMemberFromServer);
  }

  private createServer = async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body;
    const ownerId = req.user.userId;
    if (name && ((name.length < 1) || (name.length > 255))) {
      return next(new HttpException(400, "Server name should be between 1 and 255 characters"));
    }
    let server;
    if (!req.file) {
      try {
        server = await this.serverRepo.createServer(name, ownerId, DEFAULT_SERVER_ICON);
        await this.clearServerCache();
        return res.status(201).json(server);
      } catch (error) {
        return next(new HttpException(500, "Internal server error"));
      }
    }

    if (req.file) await this.fileRepository.uploadImage(req.file, "servers").then(async (url) => {
      try {
        server = await this.serverRepo.createServer(name, ownerId, url);
        await this.clearServerCache();
        res.status(201).json(server);
      } catch (error) {
        next(new HttpException(500, "Internal server error"));
      }
    }).catch(async (error) => {
      next(new HttpException(400, error))
    })

    if (!server) {
      return next(new HttpException(400, "Failed to create server"));
    };

  };

  private getServerById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { userId } = req.user;
    try {
      console.time("getServerById");
      const server = await this.serverRepo.getServerById(Number(id));
      console.timeEnd("getServerById");
      if (!server) {
        return next(new HttpException(404, "Server not found"));
      }
      const Roles = server?.Roles.map((role) => {
        return {
          id: role.id,
          name: role.name,
          color: role.color,
          permissions: role.RolePermissions.map((p) => p.Permission.name),
        }
      });

      if (!server.Members.find((member) => member.User.id === userId)) {
        return next(new HttpException(403, "You are not a member of this server"));
      };

      const roleId = server.Members.find((member) => member.User.id === userId)?.roleId;
      if (!roleId) return next(new HttpException(403, "You are not a member of this server"));

      let permissions = server.Roles.find((role) => role.id === roleId)?.RolePermissions;
      let permissionStrings = permissions?.map((p) => p.Permission.name);
      if (server.ownerId === userId && permissionStrings) permissionStrings.push("owner");
      if (server.ownerId === userId && !permissionStrings) permissionStrings = ["owner"];
      const payload: ServerAccessTokenPayload = {
        serverId: Number(id),
        userId: userId,
        roleId: roleId,
        permissions: permissionStrings ? permissionStrings : [],
      }
      const serverToken = JWT.generateToken(payload, "SERVER_ACCESS");
      CookieHelper.setCookie(CookieKeys.SERVER_TOKEN, serverToken, res);

      let Channels = await this.channelRepo.getChannelsByServerId(Number(id));
      Channels = Channels.map((channel) => {
        if (channel.password) {
          channel.password = true;
        }
        return channel;
      });
      const response = { ...server, Channels: Channels, Roles: Roles };
      await cacheHelper.setResponseCache(req, this.path, response);
      res.status(200).json(response);
    } catch (error) {
      new HttpException(500, "Failed to retrieve server");
    }
  };

  private getServers = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.user;
    try {
      const servers = await this.serverRepo.getServersByUserId(Number(userId));
      await cacheHelper.setResponseCache(req, this.path, servers);
      res.status(200).json(servers);
    } catch (error) {
      next(new HttpException(500, "Failed to retrieve servers"));
    }
  };

  private updateServer = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
      const server = await this.serverRepo.getServerById(Number(id));
      if (!server) {
        return next(new HttpException(404, "Server not found"));
      }
      if (server.ownerId !== req.user.userId) {
        return next(new HttpException(403, "You are not the owner of this server"));
      };

      if (name && ((name.length < 1) || (name.length > 255))) {
        return next(new HttpException(400, "Server name should be between 1 and 255 characters"));
      }

      if (!req.file) {
        const updatedServer = await this.serverRepo.updateServer(Number(id), name);
        await this.clearServerCache();
        return res.status(200).json(updatedServer);
      }

      if (req.file) await this.fileRepository.uploadImage(req.file, "servers").then(async (url) => {
        const updatedServer = await this.serverRepo.updateServer(Number(id), name, url);
        await this.clearServerCache();
        return res.status(200).json(updatedServer);
      }).catch(async (error) => {
        next(new HttpException(400, error))
      })
    } catch (error) {
      next(new HttpException(500, "Failed to update server"));
    }
  };

  private deleteServer = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { userId } = req.user;
    try {
      const server = await this.serverRepo.getServerById(Number(id));
      if (!server) {
        return next(new HttpException(404, "Server not found"));
      }
      if (server.ownerId !== userId) {
        return next(new HttpException(403, "You are not the owner of this server "));
      }
      await this.serverRepo.deleteServer(Number(id));
      await this.clearServerCache();
      res.status(200).json({ message: "Server deleted successfully" });
    } catch (error) {
      next(new HttpException(500, (error as any).message));
    }
  };

  private joinServer = async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.body;
    const { userId } = req.user;
    try {
      const server = await this.serverRepo.getServerByInviteToken(token);
      if (!server) {
        return next(new HttpException(400, "Token is invalid"));
      }
      if (!server.InviteLink) {
        return next(new HttpException(400, "Server does not have an invite link"));
      }
      let member;
      try {
         member = await this.serverRepo.joinServer({ userId, serverId: server.id });
        if(member) {
          const getServer = await this.serverRepo.getServerById(server.id);
          if(getServer) {
            await this.notiRepo.createNotification({
              userId: server.ownerId,
              message: `Thành viên ${member.User.loginName} đã tham gia server "${getServer.name}" của bạn.`,
              type: "server",
            })
          }
        }
        await this.clearServerCache();
      } catch (error: any) {
        console.log(error);
        return next(new HttpException(400, error.message));
      }

      res.status(200).json(member);
    } catch (error) {
      next(new HttpException(500, "Internal server error"));
    }
  };

  private leaveServer = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { userId } = req.user;
    try {
      const server = await this.serverRepo.getServerById(Number(id));
      if (!server) {
        return next(new HttpException(404, "Server not found"));
      }
      if (server.ownerId === userId) {
        return next(new HttpException(403, "Owner cannot leave server"));
      }
      await this.serverRepo.leaveServer(userId, Number(id));
      await this.clearServerCache();
      res.status(200).json({ message: "Left server successfully" });
    } catch (error) {
      next(new HttpException(500, "Failed to leave server"));
    }
  };

  private createInviteLink = async (req: Request, res: Response, next: NextFunction) => {
    const { serverId, count, expireIn } = req.body;
    try {
      const server = await this.serverRepo.getServerById(serverId);
      if (!server) {
        return next(new HttpException(404, "Server not found"));
      }
      if (server.ownerId !== req.user.userId) {
        return next(new HttpException(403, "You are not the owner of this server"));
      }
      const inviteLinkBefore = await this.serverRepo.getInviteToken(serverId);
      console.log(inviteLinkBefore);
      if (inviteLinkBefore) {
        await this.serverRepo.deleteInviteToken(serverId);
      }
      const inviteLink = await this.serverRepo.generateInviteToken({ serverId, count, expireIn });
      await this.clearServerCache();
      res.status(200).json(inviteLink);
    } catch (error) {
      next(new HttpException(500, error as string));
    }
  };

  private getServerByInviteToken = async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.params;
    try {
      const server = await this.serverRepo.getServerByInviteToken(token);
      if (!server) {
        return next(new HttpException(404, "Server not found"));
      }
      await cacheHelper.setResponseCache(req, this.path, server);
      res.status(200).json(server);
    } catch (error) {
      next(new HttpException(500, "Failed to retrieve server"));
    }
  }

  private kickMemberFromServer = async (req: Request, res: Response, next: NextFunction) => {
    const { userId, serverId } = req.body;
    const { userId: userRequestId } = req.user;
    try {
      const server = await this.serverRepo.getServerById(serverId);
      if (!server) {
        return next(new HttpException(404, "Server not found"));
      }
      if (server.ownerId === userId) {
        return next(new HttpException(400, "You can not kick the owner of this server"));
      }
      if (userId === userRequestId) {
        return next(new HttpException(400, "You can not kick yourself"));
      }
      await this.serverRepo.leaveServer(userId, serverId);
      await this.clearServerCache();
      res.status(200).json({ message: "Kicked member successfully" });
    } catch (error) {
      next(new HttpException(500, "Failed to kick member"));
    }
  }
}
