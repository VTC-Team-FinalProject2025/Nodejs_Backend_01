import { PrismaClient } from "@prisma/client";
import HttpException from "../exceptions/http-exception";
import paginate from "../helpers/Pagination";
import authMiddleware from "../middlewares/authentication.middleware";
import validateSchema from "../middlewares/validateSchema.middleware";
import FriendShipRepository from "../repositories/FriendRepository";
import { FriendShipFormSchema } from "../schemas/friendShip";
import { BaseController } from "./abstractions/base-controller";
import express from "express";

export default class FriendShipController extends BaseController {
  public path = "/friend";
  public friendShipRepo: FriendShipRepository;
  public prisma: PrismaClient;

  constructor(friendShipRepo: FriendShipRepository, prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.friendShipRepo = friendShipRepo;
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.use(authMiddleware);
    this.router.post(
      this.path + "/make-friend",
      validateSchema(FriendShipFormSchema),
      this.makeFriend,
    );
    this.router.get(this.path + "/lists-friend", this.friendsList);
    this.router.get(this.path + "/friend-request-list", this.friendRequestList);
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

  friendsList = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const { userId } = request.user;
    const { page = 1, limit = 10, search } = request.query;
    const filterCondition = search
      ? {
          OR: [
            {
              senderId: Number(userId),
              receiver: {
                loginName: { contains: search, mode: "insensitive" },
              },
            },
            {
              receiverId: Number(userId),
              sender: { loginName: { contains: search, mode: "insensitive" } },
            },
          ],
        }
      : { OR: [{ senderId: Number(userId) }, { receiverId: Number(userId) }] };

    const includeFields = {
      sender: { select: { id: true, loginName: true, avatarUrl: true } },
      receiver: { select: { id: true, loginName: true, avatarUrl: true } },
    };
    const result = await paginate(
      this.prisma.friendship,
      Number(page),
      Number(limit),
      filterCondition,
      includeFields,
    );

    response.json(result);
  };

  friendRequestList = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const { userId } = request.user;
    const { page = 1, limit = 10, search } = request.query;

    try {
      const filterCondition = search
        ? {
            OR: [
              {
                receiverId: Number(userId),
                status: "pending",
                sender: {
                  loginName: { contains: search, mode: "insensitive" },
                },
              },
            ],
          }
        : { OR: [{ receiverId: Number(userId) }] };

      const includeFields = {
        sender: { select: { id: true, loginName: true, avatarUrl: true } },
      };

      const result = await paginate(
        this.prisma.friendship,
        Number(page),
        Number(limit),
        filterCondition,
        includeFields,
      );

      response.json(result);
    } catch (error) {
      next(new HttpException(500, "Failed to fetch friend requests"));
    }
  };
}
