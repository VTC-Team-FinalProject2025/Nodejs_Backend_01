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

    this.router.post(`/`, this.createStory); // POST /stories
    this.router.get(`/`, this.getStories); // GET /stories
    this.router.post(`/:id/view`, this.markAsViewed); // POST /stories/:id/view
    this.router.get(`/:id/views`, this.getStoryViews); // GET /stories/:id/views
    this.router.delete(`/:id`, this.deleteStory); // DELETE /stories/:id
  }

  // POST /stories – tạo story
  private createStory = async (req: Request, res: Response, next: NextFunction) => {
    const { mediaUrl, visibility, allowedUserIds, image } = req.body;
    const userId = req.user.id;

    try {
      const story = await this.storyRepo.createStoryWithCustomVisibility({
        userId,
        mediaUrl,
        visibility,
        allowedUserIds,
        image
      });
      res.status(201).json({ message: "Successfully posted story"});
    } catch (error) {
      next(new HttpException(500, "Failed to create story"));
    }
  };

  // GET /stories – lấy danh sách story bạn bè và mình
  private getStories = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.userId;
    const { page = 1, pageSize = 10 } = req.query;

    try {
      const stories = await this.storyRepo.listStories(userId, Number(page), Number(pageSize));
      res.status(200).json(stories);
    } catch (error) {
      next(new HttpException(500, "Failed to get stories"));
    }
  };

  // POST /stories/:id/view – đánh dấu đã xem story
  private markAsViewed = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.userId;
    const storyId = Number(req.params.id);

    try {
      const view = await this.storyRepo.markStoryAsViewed(storyId, userId);
      res.status(200).json({ message: `read story with storyId ${storyId}`});
    } catch (error) {
      next(new HttpException(500, "Failed to mark story as viewed"));
    }
  };

  // GET /stories/:id/views – lấy danh sách ai đã xem
  private getStoryViews = async (req: Request, res: Response, next: NextFunction) => {
    const storyId = Number(req.params.id);

    try {
      const viewers = await this.storyRepo.getStoryViews(storyId);
      res.status(200).json(viewers);
    } catch (error) {
      next(new HttpException(500, "Failed to get story views"));
    }
  };

  // DELETE /stories/:id – xoá story
  private deleteStory = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.userId;
    const storyId = Number(req.params.id);

    try {
      await this.storyRepo.deleteStoryById(storyId, userId);
      res.status(204).send();
    } catch (error) {
      next(new HttpException(500, "Failed to delete story"));
    }
  };
}