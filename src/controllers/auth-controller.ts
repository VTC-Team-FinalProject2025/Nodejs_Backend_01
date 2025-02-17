import express from "express";
import { BaseController } from "./abstractions/base-controller";
import HttpException from "../exceptions/http-exception";
import bcrypt, { hashSync } from "bcrypt";
import JWTHelper from "../helpers/JWT";
import ValidateSchema from "../middlewares/validateSchema.middleware";
import { SignupFormSchema, LoginFormSchema } from "../schemas/auth";
import SendEmailResetPassword from "../emails/emailForgotPassword.email";
import { CookieKeys } from "../constants";
import CookieHelper from "../helpers/Cookie";
import ValidatorHelper from "../helpers/Validator";
import { BYCRYPT_SALT } from "../constants";
import EmailAuthenticatedUser from "../emails/emailAuthenticatedUser";
import UserRepository from "../repositories/UserRepository";

export default class AuthController extends BaseController {
  public path = "/auth";
  public userRepo: UserRepository;
  constructor(userRepo: UserRepository) {
    super();
    this.userRepo = userRepo;
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
    this.router.post(this.path + "/verify-email", this.vertifyEmail);
    this.router.post(this.path + "/logout", this.logout);
    this.router.post(this.path + "/forgot-password", this.forgotPassword);
    this.router.post(this.path + "/refresh-token", this.resetToken);
  }

  login = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const { input, password } = request.body;
    let user = ValidatorHelper.isEmail(input)
      ? await this.userRepo.getUserByEmail(input)
      : await this.userRepo.getUserByLoginName(input);
    if (!user) {
      return next(new HttpException(404, "Account does not exist"));
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(new HttpException(400, "Incorrect password"));
    }
    if (!user.isEmailVertify) {
      return next(new HttpException(401, "Email is not vertify"));
    }
    if (!user.status) {
      return next(new HttpException(402, "Account is blocked"));
    }
    const token = JWTHelper.generateToken({ userId: user.id }, "ACCESS");
    const refresh_token = JWTHelper.generateToken(
      { userId: user.id },
      "REFRESH",
    );

    CookieHelper.setCookie(CookieKeys.ACCESS_TOKEN, token, response);
    CookieHelper.setCookie(CookieKeys.REFRESH, refresh_token, response);
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

    if (password !== password_confirmation) {
      return next(new HttpException(401, "Password authentication mismatch"));
    }

    let user = await this.userRepo.getUserByEmail(email);
    if (user) {
      return next(new HttpException(400, "Already have an account"));
    }

    let isPhoneExist = await this.userRepo.getUserByPhone(phone);
    if (isPhoneExist) {
      return next(new HttpException(400, "Phone number already exists"));
    }

    let isLoginNameExist = await this.userRepo.getUserByLoginName(loginName);
    if (isLoginNameExist) {
      return next(new HttpException(400, "Login name already exists"));
    }

    user = await this.userRepo.createUser({
      firstName,
      lastName,
      loginName,
      email,
      phone,
      password: hashSync(password, BYCRYPT_SALT),
    });
    const vertifyToken = await JWTHelper.generateToken(
      { userId: user.id },
      "VERTIFY_EMAIL",
    );
    setImmediate(() => {
      EmailAuthenticatedUser({ user: { loginName }, vertifyToken });
    });
    response.json({ message: "Successful registration" });
  };

  vertifyEmail = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const { token } = request.body;
    if (!token) {
      return next(new HttpException(404, "Token not found"));
    }

    const payload = JWTHelper.verifyToken(
      token as string,
      "VERTIFY_EMAIL",
    ) as any;
    if (!payload) {
      return next(new HttpException(400, "Token is invalid"));
    }

    const tokenPayload = JWTHelper.decodeToken(token as string) as {
      userId: number;
    };
    const user = await this.userRepo.getUserById(tokenPayload.userId);
    if (user?.isEmailVertify) {
      return next(new HttpException(401, "Email is already vertify"));
    }
    await this.userRepo.updateUser(tokenPayload.userId, {
      isEmailVertify: true,
      status: true,
    });
    response.json({ message: "Vertify email successful" });
  };

  logout = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    CookieHelper.clearAllCookies(response);
    response.json({ message: "Logout successful" });
  };

  forgotPassword = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const { email } = request.body;
    if (!email) {
      return next(new HttpException(400, "Email not filled in"));
    } else if (!ValidatorHelper.isEmail(email)) {
      return next(new HttpException(400, "Not an email address"));
    }
    let user = await this.userRepo.getUserByEmail(email);

    if (!user) {
      return next(new HttpException(404, "This email does not exist"));
    }
    const resetToken = JWTHelper.generateToken(
      { userId: user.id },
      "RESET_PASSWORD",
    );

    setImmediate(() => {
      SendEmailResetPassword(user, resetToken);
    });

    response.json({ message: "Successful email person" });
  };

  resetToken = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const refreshToken = request.body.refreshToken;

    if (!refreshToken) {
      return next(new HttpException(400, "Missing refresh token"));
    }
    const payload = JWTHelper.verifyToken(refreshToken, "REFRESH");

    if (!payload || !payload.userId) {
      return next(new HttpException(400, "Invalid refresh token"));
    }
    let getUserById = await this.userRepo.getUserById(payload.userId);

    if (!getUserById) {
      return next(new HttpException(400, "User does not exist"));
    }

    const token = JWTHelper.generateToken({ userId: getUserById.id }, "ACCESS");
    const refresh_token = JWTHelper.generateToken(
      { userId: getUserById.id },
      "REFRESH",
    );

    CookieHelper.setCookie(CookieKeys.ACCESS_TOKEN, token, response);
    CookieHelper.setCookie(CookieKeys.REFRESH, refresh_token, response);
    response.json({ token, refresh_token });
  };
}
