import express from "express";
import { BaseController } from "./abstractions/base-controller";
import ChatChannelRepository from "../repositories/chatChannelRepository";
import authMiddleware from "../middlewares/authentication.middleware";

export default class MessageChannelController extends BaseController {
  private readonly chatChanelRepo: ChatChannelRepository;

  constructor(chatChanelRepo: ChatChannelRepository) {
    super();
    this.path = "/chat-channel";
    this.chatChanelRepo = chatChanelRepo;
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.use(authMiddleware);
    this.router.get("/list-recent-chats", this.ListRecentChats);
    this.router.get("/list-chats", this.ListChats);
  }

  private readonly ListRecentChats = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const { userId } = request.user;
      const { page = 1, limit = 20 } = request.query;
      const pageSize = Number(limit);

      const recentChats = await this.chatChanelRepo.ListRecentChats(
        Number(userId),
        Number(page),
        Number(pageSize)
      );
      response.json(recentChats);
    } catch (error) {
      next(error);
    }
  };
  private readonly ListChats = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const { page = 1, limit = 20, channelId } = request.query;
      const pageSize = Number(limit);

      const messages = await this.chatChanelRepo.getMessages(
        Number(channelId),
        Number(page),
        pageSize
      );
      response.json(messages);
    } catch (error) {
      next(error);
    }
  };
}
