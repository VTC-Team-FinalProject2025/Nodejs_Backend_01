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
import NotificationRepository from "../repositories/notificationRepository";
import UserRepository from "../repositories/UserRepository";
import JWT from "../helpers/JWT";
import { CookieKeys } from "../constants";
import Cookie from "../helpers/Cookie";

interface User {
  id: number;
  loginName: string;
  avatarUrl: string;
}

export default class FriendShipController extends BaseController {
  public friendShipRepo: FriendShipRepository;
  public prisma: PrismaClient;
  public db: Database;
  public notiRepo: NotificationRepository;
  public userRepo: UserRepository;
  constructor(
    friendShipRepo: FriendShipRepository,
    prisma: PrismaClient,
    db: Database,
    notiRepo: NotificationRepository,
    userRepo: UserRepository,
  ) {
    super();
    this.path = "/friend";
    this.prisma = prisma;
    this.friendShipRepo = friendShipRepo;
    this.db = db;
    this.notiRepo = notiRepo;
    this.userRepo = userRepo;
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
    this.router.get("/list-friend-suggestions", this.friendSuggestions);
    this.router.get("/search-friend", this.searchFriend);
    this.router.delete("/cancel-friend", this.cancelFriendRequest);
    this.router.delete("/unfriend", this.unFriendRequest);
    this.router.delete("/unblock", this.unblock);
    this.router.get("/get-call-token", this.getCallToken);
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

    const createFriend = await this.friendShipRepo.createFriendShip({
      senderId,
      receiverId,
    });

    await this.notiRepo.createNotification({
      userId: createFriend.receiverId,
      message: `Có một lời mời kết bạn từ ${createFriend.sender.loginName}`,
      type: "addFriend",
    });

    response.json({ message: "Friend request sent successfully" });
  };

  onlineFriendsList = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const { userId } = request.user as { userId: number };
    const onlineUsersSnapshot = await this.db
      .ref("usersOnline")
      .once("value");
    const onlineUsers = onlineUsersSnapshot.val() || {};
    const onlineUserIds = new Set(Object.keys(onlineUsers).map(Number));

    const includeFields = {
      sender: { select: { id: true, loginName: true, avatarUrl: true } },
      receiver: { select: { id: true, loginName: true, avatarUrl: true } },
    };

    let onlineFriends: any = await this.friendShipRepo.getOnlineFriends(
      userId,
      onlineUserIds,
      includeFields
    );

    onlineFriends = onlineFriends.map((friendship: any) => {
      const user = friendship.senderId === userId ? friendship.receiver : friendship.sender;
      return {
        id: user.id,
        loginName: user.loginName,
        avatarUrl: user.avatarUrl,
      };
    });

    response.json({
      data: onlineFriends,
    });
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
              is: {
                loginName: { contains: search }
              }
            }
          },
          {
            receiverId: Number(userId),
            status: "accepted",
            sender: {
              is: {
                loginName: { contains: search }
              }
            }
          }
        ]
      }
      : { OR: [{ senderId: Number(userId) }, { receiverId: Number(userId) }] };

    const includeFields = {
      sender: { select: { id: true, loginName: true, avatarUrl: true } },
      receiver: { select: { id: true, loginName: true, avatarUrl: true } },
    };

    let allFriends = this.friendShipRepo.getAllFriends(
      filterCondition,
      includeFields,
      Number(limit),
      Number(page)
    );
    let totalFriends = this.friendShipRepo.countFriends(filterCondition);

    const result = await Promise.all([allFriends, totalFriends]);
    const formattedData = result[0].map((friendship: any) => {
      const user = friendship.senderId === userId ? friendship.receiver : friendship.sender;
      return {
        id: user.id,
        loginName: user.loginName,
        avatarUrl: user.avatarUrl,
      };
    }
    );

    response.json({
      data: formattedData,
      pagination: {
        total: result[1],
        page: Number(page),
        limit: Number(limit),
        hasNextPage: Number(page) * Number(limit) < result[1],
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

    const updateFriend = await this.friendShipRepo.updateFriendShipId(
      friendRequest.id,
      {
        status: "accepted",
      },
    );

    await this.notiRepo.createNotification({
      userId: updateFriend.senderId,
      message: `${updateFriend.receiver.loginName} đã chấp nhận lời mời kết bạn`,
      type: "acceptFriend",
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

  friendSuggestions = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const { userId } = request.user;
    const { page = 1, limit = 10 } = request.query;

    const friends = await this.friendShipRepo.listFriendUser(userId);
    const friendIds = friends.map((f) =>
      f.senderId === userId ? f.receiverId : f.senderId,
    );

    const suggestedFriends = await this.friendShipRepo.suggestedFriends(
      friendIds,
    );

    const suggestedFriendIds = new Set();
    suggestedFriends.forEach((f) => {
      if (f.senderId !== userId && !friendIds.includes(f.senderId)) {
        suggestedFriendIds.add(f.senderId);
      }
      if (f.receiverId !== userId && !friendIds.includes(f.receiverId)) {
        suggestedFriendIds.add(f.receiverId);
      }
    });

    const total = await this.userRepo.totalUsersArray(suggestedFriendIds);

    const users = await this.userRepo.filterUserListArray(
      suggestedFriendIds,
      Number(page),
      Number(limit),
    );

    const totalPages = Math.ceil(Number(total) / Number(limit));
    const hasNextPage = Number(page) < totalPages;
    const hasPrevPage = Number(page) > 1;

    response.json({
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  };

  searchFriend = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const { userId } = request.user;
    const { search, page = 1, limit = 10 } = request.query;
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const excludedUserIds = await this.friendShipRepo.getExcludedUsers(userId);
    const users = await this.userRepo.findUsersExcludedUserIds(search as string, excludedUserIds, pageNumber, limitNumber);
    const total = await this.userRepo.countUsersExcludedUserIds(search as string, excludedUserIds);
    const totalPages = Math.ceil(total / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    return response.json({
      data: users,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  }
  getCallToken = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const { userId } = request.user;
    const { receiverId, isCaller } = request.query;

    if (receiverId === userId) {
      return next(new HttpException(404, "Cannot send request to yourself"));
    }
    const user = await this.userRepo.getUserById(Number(userId))
    const token = JWT.generateToken({
      iss: "jitsi-vtc",
      aud: "jitsi",
      sub: "jitsi-vtc.duckdns.org",
      room: "call-" + (isCaller ? userId + "-" + receiverId : receiverId + "-" + userId),
      context: {
        user: {
          name: user.loginName,
          id: userId,
          avatar: user.avatarUrl || "https://robohash.org/" + user.loginName,
        }
      }
    }, "SERVER_ACCESS");
    response.json({ token });
  }
}
