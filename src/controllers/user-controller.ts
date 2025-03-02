import express from "express";
import { BaseController } from "./abstractions/base-controller";
import authMiddleware from "../middlewares/authentication.middleware";
import UserRepository from "../repositories/UserRepository";
import { PrismaClient } from "@prisma/client";
import HttpException from "../exceptions/http-exception";
import bcrypt from "bcrypt";
import { BYCRYPT_SALT } from "../constants";
import validateSchema from "../middlewares/validateSchema.middleware";
import {
  UpdateLoginNameFormSchema,
  UpdateNameFormSchema,
  UpdatePasswordFormSchema,
} from "../schemas/user";

export default class UserController extends BaseController {
  private userRepo: UserRepository;

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
  }

  private updateLoginName = async (
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

  private updateName = async (
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

  private updatePassword = async (
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
}
