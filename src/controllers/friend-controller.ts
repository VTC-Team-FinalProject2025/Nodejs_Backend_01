import { PrismaClient } from "@prisma/client";
import HttpException from "../exceptions/http-exception";
import paginate from "../helpers/Pagination";
import authMiddleware from "../middlewares/authentication.middleware";
import validateSchema from "../middlewares/validateSchema.middleware";
import FriendShipRepository from "../repositories/FriendRepository";
import {
  AcceptFriendFormSchema,
  FriendShipFormSchema,
} from "../schemas/friendShip";
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
    this.router.put(
      this.path + "/accept-friend",
      validateSchema(AcceptFriendFormSchema),
      this.acceptFriendRequest,
    );
    this.router.put(this.path + "/block-friend", this.blockFriend);
    this.router.get(this.path + "/lists-friend", this.friendsList);
    this.router.get(this.path + "/friend-request-list", this.friendRequestList);
    this.router.delete(this.path + "/cancel-friend", this.cancelFriendRequest);
    this.router.delete(this.path + "/unfriend", this.unFriendRequest);
    this.router.delete(this.path + "/unblock", this.unblock);
  }

  makeFriend = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const { userId: senderId } = request.user;
    const { receiverId } = request.body;

    if (senderId === receiverId) {
      return next(
        new HttpException(404, "Can't send friend requests to yourself"),
      );
    }

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
              status: "accepted",
              receiver: {
                loginName: { contains: search, mode: "insensitive" },
              },
            },
            {
              receiverId: Number(userId),
              status: "accepted",
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
        : { OR: [{ receiverId: Number(userId), status: "pending" }] };

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

  acceptFriendRequest = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const { userId } = request.user;
    const { senderId } = request.body;

    if (senderId === userId) {
      return next(
        new HttpException(404, "Can't send friend requests to yourself"),
      );
    }

    const friendRequest = await this.friendShipRepo.friendRequest({
      senderId,
      receiverId: userId,
      status: "pending",
    });

    if (!friendRequest) {
      return next(new HttpException(404, "Friend request not found"));
    }

    await this.friendShipRepo.updateFriendShipId(friendRequest.id, {
      status: "accepted",
    });

    response.json({ message: "Friend request accepted successfully" });
  };

  cancelFriendRequest = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const { userId } = request.user;
      const { senderId } = request.body;

      if (senderId === userId) {
        return next(new HttpException(404, "Cannot send request to yourself"));
      }

      const friendship = await this.friendShipRepo.friendRequest({
        senderId,
        receiverId: userId,
        status: "pending",
      });

      if (!friendship) {
        return next(new HttpException(404, "Friendship not found"));
      }

      await this.friendShipRepo.deleteFriendship(friendship.id);

      response.json({ message: "Unfriended successfully" });
    } catch (error) {
      next(new HttpException(500, "Internal Server Error"));
    }
  };

  unFriendRequest = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const { userId } = request.user;
      const { senderId } = request.body;

      if (senderId === userId) {
        return next(new HttpException(404, "Cannot send request to yourself"));
      }

      const friendship = await this.friendShipRepo.findFriendship({
        senderId,
        receiverId: userId,
        status: "accepted",
      });

      if (!friendship) {
        return next(new HttpException(404, "Friendship not found"));
      }

      await this.friendShipRepo.deleteFriendship(friendship.id);

      response.json({ message: "Unfriended successfully" });
    } catch (error) {
      next(new HttpException(500, "Internal Server Error"));
    }
  };

  blockFriend = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const { userId } = request.user;
    const { senderId } = request.body;

    if (senderId === userId) {
      return next(new HttpException(404, "Cannot send request to yourself"));
    }

    const friendship = await this.friendShipRepo.findFriendship({
      senderId,
      receiverId: userId,
      status: "accepted",
    });

    if (!friendship) {
      return next(new HttpException(404, "Friendship not found"));
    }

    await this.friendShipRepo.updateFriendShipId(friendship.id, {
      status: "blocked",
    });

    response.json({ message: "Unfriend request was successful" });
  };

  unblock = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const { userId } = request.user;
    const { senderId } = request.body;

    if (senderId === userId) {
      return next(new HttpException(404, "Cannot send request to yourself"));
    }

    const friendship = await this.friendShipRepo.findFriendship({
      senderId,
      receiverId: userId,
      status: "blocked",
    });

    if (!friendship) {
      return next(new HttpException(404, "Friendship not found"));
    }

    await this.friendShipRepo.deleteFriendship(friendship.id);

    response.json({ message: "Block open successfully" });
  };
}
