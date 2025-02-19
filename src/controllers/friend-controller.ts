import HttpException from "../exceptions/http-exception";
import authMiddleware from "../middlewares/authentication.middleware";
import validateSchema from "../middlewares/validateSchema.middleware";
import FriendShipRepository from "../repositories/FriendRepository";
import { FriendShipFormSchema } from "../schemas/friendShip";
import { BaseController } from "./abstractions/base-controller";
import express from "express";

export default class FriendShipController extends BaseController {
  public path = "/friend";
  public friendShipRepo: FriendShipRepository;

  constructor(friendShipRepo: FriendShipRepository) {
    super();
    this.friendShipRepo = friendShipRepo;
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.post(
      this.path + "/make-friend",
      validateSchema(FriendShipFormSchema),
      authMiddleware,
      this.makeFriend,
    );
  }

  makeFriend = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const { userId: senderId } = request.user;
    const { receiverId } = request.body;

    const existing = await this.friendShipRepo.existingFriendship(
      senderId as any,
      receiverId,
    );
    if (existing) {
      return next(new HttpException(404, "This relationship already exists!"));
    }

    await this.friendShipRepo.createFriendShip({ senderId, receiverId });

    response.json({ message: "Friend request sent successfully" });
  };
}
