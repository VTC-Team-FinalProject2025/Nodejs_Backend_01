import express from "express";
import HeroNotFoundException from "../exceptions/hero-not-found-exception";
import { BaseController } from "./abstractions/base-controller";
import HttpException from "../exceptions/http-exception";
import bcrypt, { hashSync } from "bcrypt";
import {
  GenerateRefreshToken,
  GenerateToken,
  GenerateResetPasswordToken,
} from "../middlewares/token.middleware";
import ValidateSchema from "../middlewares/validateSchema.middleware";
import { SignupFormSchema, LoginFormSchema } from "../schemas/auth";
import SendEmailResetPassword from "../emails/emailForgotPassword.email";

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
    this.router.post(this.path + "/logout", this.logout);
    this.router.post(this.path + "/forgot-password", this.forgotPassword);
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

  logout = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    response.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    response.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  };

  forgotPassword = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const { email } = request.body;
    const mailFormat = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    const isCheckEmail = mailFormat.test(email);
    if (!email) {
      return next(new HttpException(401, "Email not filled in"));
    } else if (!isCheckEmail) {
      return next(new HttpException(401, "Not an email address"));
    }
    let user = await this.prisma.users.findFirst({ where: { email } });

    if (!user) {
      return next(new HttpException(401, "This email does not exist"));
    }
    const resetToken = await GenerateResetPasswordToken(
      { userId: user.id },
      next,
    );

    await SendEmailResetPassword(user, resetToken);

    response.json({ message: "Successful email person" });
  };
}
