import { PrismaClient } from "@prisma/client";
import authMiddleware from "../middlewares/authentication.middleware";
import ServerRepository from "../repositories/serverRepository";
import { BaseController } from "./abstractions/base-controller";
import { NextFunction, Request, Response } from "express";
import ChannelRepository from "../repositories/channelRepository";
import HttpException from "../exceptions/http-exception";

export default class FileController extends BaseController {
  private serverRepo: ServerRepository;
  private prisma: PrismaClient;
  private channelRepo: ChannelRepository;

  constructor(serverRepo: ServerRepository, channelRepo: ChannelRepository, prisma: PrismaClient) {
    super();
    this.serverRepo = serverRepo;
    this.channelRepo = channelRepo;
    this.prisma = prisma;
    this.path = "/servers";
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.use(authMiddleware);
    this.router.post(`/`, this.createServer);
    this.router.get(`/:id`, this.getServerById);
    this.router.get(`/`, this.getServers);
    this.router.put(`/:id`, this.updateServer);
    this.router.delete(`/:id`, this.deleteServer);
  }

  private createServer = async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body;
    const ownerId = req.user.userId;
    try {
      const server = await this.serverRepo.createServer(name, ownerId);
      if(!server){
        return next(new HttpException(400, "Failed to create server"));
      };
      res.status(201).json(server);
    } catch (error) {
      next(new HttpException(500, "Internal server error"));
    }
  };

  private getServerById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { userId } = req.user;
    try {
      const server = await this.serverRepo.getServerById(Number(id));
      if (!server) {
        return next(new HttpException(404, "Server not found"));
      }
      if(!server.Members.find(async (member) => member.User.id === userId)){
        return next(new HttpException(403, "You are not a member of this server"));
      };
      res.status(200).json(server);
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
        if(server.ownerId !== req.user.userId){
            return next(new HttpException(403, "You are not the owner of this server"));
        };
        const updatedServer = await this.serverRepo.updateServer(Number(id), name);
        res.status(200).json(updatedServer);
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
        if(server.ownerId !== userId){
            return next(new HttpException(403, "You are not the owner of this server "));
        }
        await this.serverRepo.deleteServer(Number(id));
        res.status(200).json({ message: "Server deleted successfully" });
    } catch (error) {
        next(new HttpException(500, "Failed to delete server"));
    }
  };
} 
