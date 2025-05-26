import express from "express";
import { BaseController } from "./abstractions/base-controller";
import authMiddleware from "../middlewares/authentication.middleware";
import Chat1v1Repository from "../repositories/chat1v1Repository";

export default class Message1v1Controller extends BaseController {
  private readonly chat1v1Repo: Chat1v1Repository;

  constructor(chat1v1Repo: Chat1v1Repository) {
    super();
    this.path = "/chat1v1";
    this.chat1v1Repo = chat1v1Repo;
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.use(authMiddleware);
    this.router.get("/list-recent-chats", this.ListRecentChats);
    this.router.get("/list-chats", this.ListChats);
    this.router.get("/file", this.GetChatImages);
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

      const recentChats = await this.chat1v1Repo.ListRecentChats(
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
      const { userId } = request.user;
      const { page = 1, limit = 20, receiverId } = request.query;
      const pageSize = Number(limit);

      const messages = await this.chat1v1Repo.getMessages(
        Number(userId),
        Number(receiverId),
        Number(page),
        pageSize
      );
      response.json(messages);
    } catch (error) {
      next(error);
    }
  };

  private readonly GetChatImages = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const { userId } = request.user;
      const { chatPartnerId, field_type = 'image', page = 1, limit = 20 } = request.query;
      
      if (!chatPartnerId) {
        return response.status(400).json({ error: "chatPartnerId is required" });
      }

      const images = await this.chat1v1Repo.getChatImages(
        Number(userId),
        Number(chatPartnerId),
        String(field_type),
        Number(page),
        Number(limit)
      );
      
      response.json(images);
    } catch (error) {
      next(error);
    }
  };
}
