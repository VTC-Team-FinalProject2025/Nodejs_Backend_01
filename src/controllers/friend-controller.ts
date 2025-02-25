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
import { Database } from "firebase-admin/database";

interface User {
  id: number;
  loginName: string;
  avatarUrl: string;
}

export default class FriendShipController extends BaseController {
  public friendShipRepo: FriendShipRepository;
  public prisma: PrismaClient;
  public db: Database;

  constructor(
    friendShipRepo: FriendShipRepository,
    prisma: PrismaClient,
    db: Database,
  ) {
    super();
    this.path = "/friend";
    this.prisma = prisma;
    this.friendShipRepo = friendShipRepo;
    this.db = db;
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.use(authMiddleware);
    this.router.post(
      "/make-friend",
      validateSchema(FriendShipFormSchema),
      this.makeFriend,
    );
    this.router.put(
      "/accept-friend",
      validateSchema(AcceptFriendFormSchema),
      this.acceptFriendRequest,
    );
    this.router.put("/block-friend", this.blockFriend);
    this.router.get("/lists-friend", this.friendsList);
    this.router.get("/friend-request-list", this.friendRequestList);
    this.router.get("/list-friend-online", this.onlineFriendsList);
    this.router.get("/list-friend-block", this.friendBlocksList);
    this.router.delete("/cancel-friend", this.cancelFriendRequest);
    this.router.delete("/unfriend", this.unFriendRequest);
    this.router.delete("/unblock", this.unblock);
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

  onlineFriendsList = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
      const { userId } = request.user as { userId: number };
      const { page = 1, limit = 10, search } = request.query;
      const offset = (Number(page) - 1) * Number(limit);

      const onlineUsersSnapshot = await this.db
        .ref("usersOnline")
        .once("value");
      const onlineUsers = onlineUsersSnapshot.val() || {};
      const onlineUserIds = new Set(Object.keys(onlineUsers).map(Number));

      const filterCondition = search
        ? {
            OR: [
              {
                senderId: Number(userId),
                status: "accepted",
                receiver: {
                  id: { in: Array.from(onlineUserIds) },
                  loginName: { contains: search, mode: "insensitive" },
                },
              },
              {
                receiverId: Number(userId),
                status: "accepted",
                sender: {
                  id: { in: Array.from(onlineUserIds) },
                  loginName: { contains: search, mode: "insensitive" },
                },
              },
            ],
          }
        : {
            OR: [
              {
                senderId: Number(userId),
                receiverId: { in: Array.from(onlineUserIds) },
              },
              {
                receiverId: Number(userId),
                senderId: { in: Array.from(onlineUserIds) },
              },
            ],
          };

      const includeFields = {
        sender: { select: { id: true, loginName: true, avatarUrl: true } },
        receiver: { select: { id: true, loginName: true, avatarUrl: true } },
      };

      let onlineFriends: any = await this.friendShipRepo.getOnlineFriends(
        onlineUserIds,
        filterCondition,
        includeFields,
        Number(limit),
        offset,
      );

      const uniqueFriendsMap = new Map<number, User>();

      onlineFriends.forEach((friend: any) => {
        if (!friend.sender || !friend.receiver) return; // Kiểm tra null

        const friendData =
          friend.sender.id === userId ? friend.receiver : friend.sender;

        if (!uniqueFriendsMap.has(friendData.id)) {
          uniqueFriendsMap.set(friendData.id, {
            id: friendData.id,
            loginName: friendData.loginName,
            avatarUrl: friendData.avatarUrl,
          });
        }
      });

      const uniqueFriendsArray = Array.from(uniqueFriendsMap.values());

      const totalFriends = uniqueFriendsArray.length;
      const paginatedFriends = uniqueFriendsArray.slice(
        offset,
        offset + Number(limit),
      );

      response.json({
        data: paginatedFriends,
        pagination: {
          total: totalFriends,
          page: Number(page),
          limit: Number(limit),
          hasNextPage: offset + Number(limit) < totalFriends,
          hasPrevPage: Number(page) > 1,
        },
      });
  };

  friendsList = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const { userId } = request.user;
    const { page = 1, limit = 10, search } = request.query;
    const offset = (Number(page) - 1) * Number(limit);

    const onlineUsersSnapshot = await this.db.ref("usersOnline").once("value");
    const onlineUsers = onlineUsersSnapshot.val() || {};
    const onlineUserIds = new Set(Object.keys(onlineUsers).map(Number));

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

    let onlineFriends = await this.friendShipRepo.getOnlineFriends(
      onlineUserIds,
      filterCondition,
      includeFields,
      Number(limit),
      offset,
    );

    let remainingLimit = Number(limit) - onlineFriends.length;
    let offlineFriends: any[] = [];

    if (remainingLimit > 0) {
      offlineFriends = await this.friendShipRepo.getOfflineFriends(
        onlineUserIds,
        filterCondition,
        includeFields,
        remainingLimit,
        offset,
        onlineFriends.length,
      );
    }

    const uniqueFriendsMap = new Map();
    const allFriends = [...onlineFriends, ...offlineFriends]
      .filter(
        (friend) =>
          friend.sender.id === userId || friend.receiver.id === userId,
      )
      .forEach((friend) => {
        const friendData =
          friend.sender.id === userId ? friend.receiver : friend.sender;

        if (!uniqueFriendsMap.has(friendData.loginName)) {
          uniqueFriendsMap.set(friendData.loginName, {
            id: friendData.id,
            loginName: friendData.loginName,
            avatarUrl: friendData.avatarUrl,
            online: onlineUserIds.has(friendData.id),
          });
        }
      });

    const uniqueFriendsArray = Array.from(uniqueFriendsMap.values());

    const totalFriends = uniqueFriendsArray.length;

    const paginatedFriends = uniqueFriendsArray.slice(
      offset,
      offset + Number(limit),
    );

    response.json({
      data: paginatedFriends,
      pagination: {
        total: totalFriends,
        page: Number(page),
        limit: Number(limit),
        hasNextPage: offset + Number(limit) < totalFriends,
        hasPrevPage: Number(page) > 1,
      },
    });
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

      const formattedData = result.data.map((friendship: any) => ({
        id: friendship.sender.id,
        loginName: friendship.sender.loginName,
        avatarUrl: friendship.sender.avatarUrl,
      }));

      response.json({
        data: formattedData,
        pagination: result.pagination,
      });
    } catch (error) {
      next(new HttpException(500, "Failed to fetch friend requests"));
    }
  };

  friendBlocksList = async (
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
                status: "blocked",
                sender: {
                  loginName: { contains: search, mode: "insensitive" },
                },
              },
            ],
          }
        : { OR: [{ receiverId: Number(userId), status: "blocked" }] };

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

      const formattedData = result.data.map((friendship: any) => ({
        id: friendship.sender.id,
        loginName: friendship.sender.loginName,
        avatarUrl: friendship.sender.avatarUrl,
      }));

      response.json({
        data: formattedData,
        pagination: result.pagination,
      });
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

      const friendship = (await this.friendShipRepo.friendRequest({
        senderId,
        receiverId: userId,
        status: "pending",
      }))
        ? null
        : await this.friendShipRepo.friendRequest({
            senderId: userId,
            receiverId: senderId,
            status: "pending",
          });

      if (!friendship) {
        return next(new HttpException(404, "Friendship not found"));
      }

      await this.friendShipRepo.deleteFriendship(friendship.id);

      response.json({ message: "Canceled request friend successfully" });
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
    });

    if (!friendship) {
      this.friendShipRepo.createFriendShip({
        senderId: userId,
        receiverId: senderId,
        status: "blocked",
      });
      return response.json({
        message: "Blocked friend request was successful",
      });
    }

    await this.friendShipRepo.updateFriendShipId(friendship.id, {
      senderId: userId,
      receiverId: senderId,
      status: "blocked",
    });

    response.json({ message: "Blocked friend request was successful" });
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
      senderId: userId,
      receiverId: senderId,
      status: "blocked",
    });

    if (!friendship) {
      return next(new HttpException(404, "Friendship not found"));
    }

    await this.friendShipRepo.deleteFriendship(friendship.id);

    response.json({ message: "Block open successfully" });
  };
}
