import { Request, Response, NextFunction } from "express";
import { BaseController } from "./abstractions/base-controller";
import ChannelRepository from "../repositories/channelRepository";
import authMiddleware from "../middlewares/authentication.middleware";
import HttpException from "../exceptions/http-exception";
import ServerRepository from "../repositories/serverRepository";
import { ChannelSchema, ChannelUpdateSchema } from "../schemas/channel";
import ValidateSchema from "../middlewares/validateSchema.middleware";
import UserRepository from "../repositories/UserRepository";
import JWT from "../helpers/JWT";
import CookieHelper from "../helpers/Cookie";
import { CookieKeys } from "../constants";

export default class ChannelController extends BaseController {
  private channelRepo: ChannelRepository;
  private serverRepo: ServerRepository;
  private userRepo: UserRepository;

  constructor(channelRepo: ChannelRepository, serverRepo: ServerRepository, userRepo: UserRepository) {
    super();
    this.channelRepo = channelRepo;
    this.serverRepo = serverRepo;
    this.userRepo = userRepo;
    this.path = "/channels";
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.use(authMiddleware);
    this.router.post(`/`, ValidateSchema(ChannelSchema), this.createChannel);
    this.router.get(`/:id`, this.getChannelById);
    this.router.get(`/`, this.getChannels);
    this.router.put(`/:id`, ValidateSchema(ChannelUpdateSchema), this.updateChannel);
    this.router.delete(`/:id`, this.deleteChannel);
  }

  private createChannel = async (req: Request, res: Response, next: NextFunction) => {
    const { name, serverId, type, password } = req.body;
    try {
      const server = await this.serverRepo.getServerById(Number(serverId));
      if (!server) {
        return next(new HttpException(404, "Server not found"));
      }
      const channel = await this.channelRepo.createChannel({ name, serverId, type, password });
      if (!channel) {
        return next(new HttpException(400, "Failed to create channel"));
      }
      res.status(201).json(channel);
    } catch (error) {
      next(new HttpException(500, "Internal server error"));
    }
  };

  private getChannelById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.userId;
    try {
      const channel = await this.channelRepo.getChannelById(Number(id));
      if (!channel) {
        return next(new HttpException(404, "Channel not found"));
      }

      const user = await this.userRepo.getUserById(userId);
      if (!user) return next(new HttpException(404, "User not found"));

      let token = JWT.generateToken({
        iss: "jitsi-vtc",
        aud: "jitsi",
        sub: "jitsi-vtc.duckdns.org",
        room: "channel-" + channel.id,
        context: {
          user: {
            id: userId,
            name: user.loginName,
            avatar: user.avatarUrl || "https://robohash.org/" + user.loginName,
          }
        }
      }, "SERVER_ACCESS");
      CookieHelper.setCookie(CookieKeys.CHANNEL_TOKEN, token, res);

      res.status(200).json(channel);
    } catch (error) {
      next(new HttpException(500, "Failed to retrieve channel"));
    }
  };

  private getChannels = async (req: Request, res: Response, next: NextFunction) => {
    const { serverId } = req.query;
    try {
      const server = await this.serverRepo.getServerById(Number(serverId));
      if (!server) {
        return next(new HttpException(404, "Server not found"));
      }
      const channels = await this.channelRepo.getChannelsByServerId(Number(serverId));
      res.status(200).json(channels);
    } catch (error) {
      next(new HttpException(500, "Failed to retrieve channels"));
    }
  };

  private updateChannel = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, password } = req.body;
    try {
      const channel = await this.channelRepo.getChannelById(Number(id));
      if (!channel) {
        return next(new HttpException(404, "Channel not found"));
      }
      const updatedChannel = await this.channelRepo.updateChannel({ id: Number(id), name, password });
      res.status(200).json(updatedChannel);
    } catch (error) {
      next(new HttpException(500, "Failed to update channel"));
    }
  };

  private deleteChannel = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
      const channel = await this.channelRepo.getChannelById(Number(id));
      if (!channel) {
        return next(new HttpException(404, "Channel not found"));
      }
      await this.channelRepo.deleteChannel(Number(id));
      res.status(200).json({ message: "Channel deleted successfully" });
    } catch (error) {
      next(new HttpException(500, "Failed to delete channel"));
    }
  };
}
