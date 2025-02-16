import express from "express";
import HeroNotFoundException from "../exceptions/hero-not-found-exception";
import { BaseController } from "./abstractions/base-controller";
import HttpException from "../exceptions/http-exception";
import bcrypt, { hashSync } from "bcrypt";
import {
  GenerateRefreshToken,
  GenerateToken,
} from "../middlewares/token.middleware";
import ValidateSchema from "../middlewares/validateSchema.middleware";
import { SignupFormSchema, LoginFormSchema } from "../schemas/auth";

export default class HeroController extends BaseController {
  public path = "/auth";

  constructor() {
    super();
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.post(
      this.path + "/login",
      ValidateSchema(LoginFormSchema),
      this.login,
    );
    this.router.post(
      this.path + "/signup",
      ValidateSchema(SignupFormSchema),
      this.signup,
    );
  }

  private isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  login = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const { input, password } = request.body;

    const user = await this.prisma.users.findFirst({
      where: {
        OR: this.isValidEmail(input)
          ? [{ email: input }]
          : [{ loginName: input }],
      },
    });

    if (!user) {
      return next(new HttpException(401, "Account does not exist"));
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(new HttpException(401, "Incorrect password"));
    }
    const token = GenerateToken({ userId: user.id }, next);
    const refresh_token = GenerateRefreshToken({ userId: user.id }, next);

    response.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
      sameSite: "strict",
    });

    response.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
    });
    response.json({ token, refresh_token });
  };

  signup = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const {
      firstName,
      lastName,
      loginName,
      phone,
      email,
      password,
      password_confirmation,
    } = request.body;

    let user = await this.prisma.users.findFirst({ where: { email } });

    if (user) {
      return next(new HttpException(401, "Already have an account"));
    }

    if (password !== password_confirmation) {
      return next(new HttpException(401, "Password authentication mismatch"));
    }

    user = await this.prisma.users.create({
      data: {
        firstName,
        lastName,
        loginName,
        email,
        phone,
        password: hashSync(password, 10),
      },
    });
    response.json(user);
  };
}
