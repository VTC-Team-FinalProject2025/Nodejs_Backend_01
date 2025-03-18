import { PrismaClient } from "@prisma/client";
import authMiddleware from "../middlewares/authentication.middleware";
import ServerRepository from "../repositories/serverRepository";
import { BaseController } from "./abstractions/base-controller";
import { NextFunction, Request, Response } from "express";
import ChannelRepository from "../repositories/channelRepository";
import HttpException from "../exceptions/http-exception";
import { FileRepository } from "../repositories/fileRepository";
import multer from "multer";
import { DEFAULT_SERVER_ICON } from "../constants";
import validateSchema from "../middlewares/validateSchema.middleware";
import { InviteLinkSchema } from "../schemas/server";
import CookieHelper from "../helpers/Cookie";
import JWT from "../helpers/JWT";
import UserRepository from "../repositories/UserRepository";
import { channel } from "diagnostics_channel";

export default class FileController extends BaseController {
  private serverRepo: ServerRepository;
  private channelRepo: ChannelRepository;
  private fileRepository: FileRepository;
  private userRepo: UserRepository;
  private upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  constructor(serverRepo: ServerRepository, channelRepo: ChannelRepository, prisma: PrismaClient) {
    super();
    this.serverRepo = serverRepo;
    this.channelRepo = channelRepo;
    this.fileRepository = new FileRepository();
    this.userRepo = new UserRepository(prisma);
    this.path = "/servers";
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.use(authMiddleware);
    this.router.post(`/`, this.upload.single("icon"), this.createServer);
    this.router.get(`/:id`, this.getServerById);
    this.router.get(`/`, this.getServers);
    this.router.put(`/:id`, this.upload.single("icon"), this.updateServer);
    this.router.delete(`/:id`, this.deleteServer);
    this.router.post(`/join`, this.joinServer);
    this.router.post(`/leave/:id`, this.leaveServer);
    this.router.post(`/invite-token`, validateSchema(InviteLinkSchema), this.createInviteLink);
    this.router.get(`/invite-token/:token`, this.getServerByInviteToken);
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
        return res.status(201).json(server);
      } catch (error) {
        return next(new HttpException(500, "Internal server error"));
      }
    }

    if (req.file) await this.fileRepository.uploadImage(req.file, "servers").then(async (url) => {
      try {
        server = await this.serverRepo.createServer(name, ownerId, url);
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
      const server = await this.serverRepo.getServerById(Number(id));
      if (!server) {
        return next(new HttpException(404, "Server not found"));
      }
      if (!server.Members.find(async (member) => member.User.id === userId)) {
        return next(new HttpException(403, "You are not a member of this server"));
      };
      let Channels = await this.channelRepo.getChannelsByServerId(Number(id));
      Channels = Channels.map((channel) => {
        if (channel.password) {
          channel.password = true;
        }
        return channel;
      });
      res.status(200).json({ ...server, Channels: Channels });
    } catch (error) {
      new HttpException(500, "Failed to retrieve server");
    }
  };

  private getServers = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.user;
    try {
      const servers = await this.serverRepo.getServersByUserId(Number(userId));
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
        return res.status(200).json(updatedServer);
      }

      if (req.file) await this.fileRepository.uploadImage(req.file, "servers").then(async (url) => {
        const updatedServer = await this.serverRepo.updateServer(Number(id), name, url);
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
      res.status(200).json(server);
    } catch (error) {
      next(new HttpException(500, "Failed to retrieve server"));
    }
  }
} 
