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
import bcrypt from 'bcrypt'; // import thư viện hash


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
    this.router.post('/verify-password', this.verifyChannelPassword);

  }

  private createChannel = async (req: Request, res: Response, next: NextFunction) => {
    const { name, serverId, type, password } = req.body;
    try {
      const server = await this.serverRepo.getServerById(Number(serverId));
      if (!server) {
        return next(new HttpException(404, "Server not found"));
      }

      // Hash password nếu tồn tại
      let hashedPassword = null;
      if (password) {
        const saltRounds = 10;
        hashedPassword = await bcrypt.hash(password, saltRounds);
      }

      const channel = await this.channelRepo.createChannel({
        name,
        serverId,
        type,
        password: hashedPassword,
      });

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
      CookieHelper.setCookie(CookieKeys.CHANNEL_TOKEN, token, res, {
        httpOnly: false,
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

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

      // Hash password nếu có
      let hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

      const updatedChannel = await this.channelRepo.updateChannel({
        id: Number(id),
        name,
        password: hashedPassword,
      });

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

  private verifyChannelPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { channelId, password } = req.body;

    try {
      const channel = await this.channelRepo.getChannelById(Number(channelId));
      if (!channel) {
        return next(new HttpException(404, "Channel not found"));
      }

      if (!channel.password) {
        return next(new HttpException(400, "This channel does not require a password"));
      }

      const isMatch = await bcrypt.compare(password, channel.password);
      if (!isMatch) {
        return next(new HttpException(401, "Incorrect password"));
      }

      res.status(200).json({ message: "Password verified successfully" });
    } catch (error) {
      next(new HttpException(500, "Internal server error"));
    }
  };
}
