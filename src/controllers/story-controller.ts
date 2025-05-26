import { Request, Response, NextFunction } from "express";
import { BaseController } from "./abstractions/base-controller";
import authMiddleware from "../middlewares/authentication.middleware";
import StoryRepository from "../repositories/storyRepository";
import HttpException from "../exceptions/http-exception";

export default class StoryController extends BaseController {
  private storyRepo: StoryRepository;

  constructor(storyRepo: StoryRepository) {
    super();
    this.storyRepo = storyRepo;
    this.path = "/stories";
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.use(authMiddleware);
    this.router.post(`/`, this.createStory);
    this.router.get(`/`, this.getStories);
    this.router.post(`/:id/view`, this.markAsViewed);
    this.router.get(`/:id/views`, this.getStoryViews);
    this.router.delete(`/:id`, this.deleteStory);
    this.router.post("/:id/reactions", this.createReaction);
  }

  // POST /stories – tạo story
  private createStory = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { mediaUrl, visibility, allowedUserIds, image } = req.body;
    const userId = req.user.userId;

    try {
      const story = await this.storyRepo.createStoryWithCustomVisibility({
        userId,
        mediaUrl,
        visibility,
        allowedUserIds,
        image,
      });
      res.status(201).json({ message: "Successfully posted story" });
    } catch (error) {
      next(new HttpException(500, "Failed to create story"));
    }
  };

  // GET /stories – lấy danh sách story bạn bè và mình
  private getStories = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const userId = req.user.userId;

    try {
      const stories = await this.storyRepo.listStories(userId);
      res.status(200).json(stories);
    } catch (error) {
      next(new HttpException(500, "Failed to get stories"));
    }
  };

  // POST /stories/:id/view – đánh dấu đã xem story
  private markAsViewed = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const userId = req.user.userId;
    const storyId = Number(req.params.id);

    try {
      const view = await this.storyRepo.markStoryAsViewed(storyId, userId);
      res.status(200).json({ message: `read story with storyId ${storyId}` });
    } catch (error) {
      next(new HttpException(500, "Failed to mark story as viewed"));
    }
  };

  // GET /stories/:id/views – lấy danh sách ai đã xem
  private getStoryViews = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const storyId = Number(req.params.id);

    try {
      const viewers = await this.storyRepo.getStoryViews(storyId);
      res.status(200).json(viewers);
    } catch (error) {
      next(new HttpException(500, "Failed to get story views"));
    }
  };

  // DELETE /stories/:id – xoá story
  private deleteStory = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const userId = req.user.userId;
    const storyId = Number(req.params.id);

    try {
      await this.storyRepo.deleteStoryById(storyId, userId);
      res.status(204).send();
    } catch (error) {
      next(new HttpException(500, "Failed to delete story"));
    }
  };

  private createReaction = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const storyId = Number(req.params.id);
    const userId = req.user.userId;
    const { type } = req.body;

    if (!userId || !type) {
      return res.status(400).json({ message: "Missing userId or type" });
    }

    try {
      const reaction = await this.storyRepo.createReaction(
        storyId,
        userId,
        type,
      );
      res.status(201).json({ message: "Successfully create reaction" });
    } catch (error) {
      console.error(error);
      next(new HttpException(500, "Failed to create reaction"));
    }
  };
}
