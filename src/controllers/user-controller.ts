import express from "express";
import { BaseController } from "./abstractions/base-controller";
import authMiddleware from "../middlewares/authentication.middleware";
import UserRepository from "../repositories/UserRepository";
import HttpException from "../exceptions/http-exception";
import bcrypt from "bcrypt";
import { BYCRYPT_SALT, CookieKeys } from "../constants";
import validateSchema from "../middlewares/validateSchema.middleware";
import {
  UpdateLoginNameFormSchema,
  UpdateNameFormSchema,
  UpdatePasswordFormSchema,
} from "../schemas/user";
import JWT from "../helpers/JWT";

export default class UserController extends BaseController {
  private readonly userRepo: UserRepository;

  constructor(userRepo: UserRepository) {
    super();
    this.path = "/user";
    this.userRepo = userRepo;
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.use(authMiddleware);
    this.router.put(
      "/update-login-name",
      validateSchema(UpdateLoginNameFormSchema),
      this.updateLoginName,
    );
    this.router.put(
      "/update-name",
      validateSchema(UpdateNameFormSchema),
      this.updateName,
    );
    this.router.put(
      "/update-password",
      validateSchema(UpdatePasswordFormSchema),
      this.updatePassword,
    );
    this.router.get("/get-call-token", this.getCallToken);
  }

  private readonly updateLoginName = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const { userId } = req.user;
    const { newLoginName } = req.body;

    const user = await this.userRepo.getUserById(userId);
    if (!user) {
      return next(new HttpException(404, "Missing required information"));
    }
    const lastUpdated = new Date(user.updatedAt);
    const now = new Date();
    const daysDiff = Math.floor(
      (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysDiff < 14) {
      return next(new HttpException(400, "Missing required information"));
    }

    await this.userRepo.updateUser(userId, {
      loginName: newLoginName,
      updatedAt: now,
    });
    res.status(200).json({ message: "LoginName updated successfully" });
  };

  private readonly updateName = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const { userId } = req.user;
    const { firstName, lastName } = req.body;

    await this.userRepo.updateUser(userId, {
      firstName,
      lastName,
    });

    res.status(200).json({ message: "Full name updated successfully" });
  };

  private readonly updatePassword = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const { userId } = req.user;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return next(
        new HttpException(
          404,
          "New password and confirm password do not match",
        ),
      );
    }

    const user = await this.userRepo.getUserById(userId);
    if (!user) {
      return next(new HttpException(404, "Missing required information"));
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return next(new HttpException(400, "Old password is incorrect"));
    }

    const hashedPassword = await bcrypt.hash(newPassword, BYCRYPT_SALT);
    await this.userRepo.updateUser(userId, {
      password: hashedPassword,
    });
    res.status(200).json({ message: "Password changed successfully" });
  };

  private readonly getCallToken = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const { userId } = req.user;
      const { to } = req.query;
      const user = await this.userRepo.getUserById(userId);
      if (!user) return next(new HttpException(404, "User not found"));

      let token = JWT.generateToken({
        iss: "jitsi-vtc",
        aud: "jitsi",
        sub: "jitsi-vtc.duckdns.org",
        room: "call-" + userId + "-" + to,
        context: {
          user: {
            id: userId,
            name: user.loginName,
            avatar: user.avatarUrl || "https://robohash.org/" + user.loginName,
          }
        }
      }, "SERVER_ACCESS");

      return res.status(200).json({
        token: token,
        room: "call-" + userId + "-" + to,
      })
    } catch (error) {
      return next(new HttpException(500, "Internal server error"));
    }
  }
}
