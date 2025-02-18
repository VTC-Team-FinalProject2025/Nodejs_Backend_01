import express from "express";
import { BaseController } from "./abstractions/base-controller";
import HttpException from "../exceptions/http-exception";
import bcrypt, { hashSync } from "bcrypt";
import JWTHelper from "../helpers/JWT";
import ValidateSchema from "../middlewares/validateSchema.middleware";
import { SignupFormSchema, LoginFormSchema, ForgetPasswordFormSchema } from "../schemas/auth";
import SendEmailResetPassword from "../emails/emailForgotPassword.email";
import { CookieKeys } from "../constants";
import CookieHelper from "../helpers/Cookie";
import ValidatorHelper from "../helpers/Validator";
import { BYCRYPT_SALT } from "../constants";
import EmailAuthenticatedUser from "../emails/emailAuthenticatedUser";
import UserRepository from "../repositories/UserRepository";
import { v4 as uuidv4} from "uuid";

export default class AuthController extends BaseController {
  public path = "/auth";
  public userRepo : UserRepository;
  public passport;
  constructor(userRepo: UserRepository, passport : any) {
    super();
    this.userRepo = userRepo;
    this.passport = passport;
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
    this.router.post(this.path + "/reset-password", ValidateSchema(ForgetPasswordFormSchema), this.resetPassword);
    this.router.post(this.path + "/refresh-token", this.resetToken);
    this.router.get(this.path + "/google", this.passport.authenticate("google", { scope: ["profile", "email"] }));
    this.router.get(
      this.path + "/google/callback",
      this.passport.authenticate("google", { session: false }),
      this.handleGoogleCallback,
    );

    this.router.get(this.path + "/github", this.passport.authenticate("github", { scope: ["user:email"] }));
    this.router.get(
      this.path + "/github/callback",
      this.passport.authenticate("github", { session: false }),
      this.handleGitHubCallback,
    );
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
      EmailAuthenticatedUser({ user: { loginName, email }, vertifyToken });
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
  resetPassword = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const { token, password, password_confirmation } = request.body;
    if (password !== password_confirmation) {
      return next(new HttpException(401, "Password authentication mismatch"));
    }
    if (!token) {
      return next(new HttpException(404, "Token not found"));
    }
    const payload = JWTHelper.verifyToken(token as string, "RESET_PASSWORD") as any;
    if (!payload) {
      return next(new HttpException(400, "Token is invalid"));
    }
    const tokenPayload = JWTHelper.decodeToken(token as string) as { userId: number };
    const user = await this.userRepo.getUserById(tokenPayload.userId);
    if (!user) {
      return next(new HttpException(404, "User not found"));
    }
    await this.userRepo.updateUser(tokenPayload.userId, {
      password: hashSync(password, BYCRYPT_SALT),
    });
    response.json({ message: "Password reset successful" });
  };
  handleGoogleCallback = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const user = (request.user as any).profile as GoogleProfile;
    const userExisted = await this.userRepo.getUserByEmail(user.emails[0].value);
    if(userExisted){
      const token = JWTHelper.generateToken({ userId: userExisted.id }, "ACCESS");
      const refresh_token = JWTHelper.generateToken({ userId: userExisted.id }, "REFRESH");
      CookieHelper.setCookie(CookieKeys.ACCESS_TOKEN, token, response);
      CookieHelper.setCookie(CookieKeys.REFRESH, refresh_token, response);
      return response.json({ token, refresh_token });
    } else {
      let userCreate = await this.userRepo.createUser({
        firstName: user.name.givenName,
        lastName: user.name.familyName,
        loginName: uuidv4(),
        email: user.emails[0].value,
        password: hashSync(uuidv4(), BYCRYPT_SALT),
        isEmailVertify: true,
        status: true,
        phone: "",
      });
      const token = JWTHelper.generateToken({ userId: userCreate.id }, "ACCESS");
      const refresh_token = JWTHelper.generateToken({ userId: userCreate.id }, "REFRESH");
      CookieHelper.setCookie(CookieKeys.ACCESS_TOKEN, token, response);
      CookieHelper.setCookie(CookieKeys.REFRESH, refresh_token, response);
      return response.json({ token, refresh_token });
    }
  };

  handleGitHubCallback = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    const user = (request.user as any).profile as GitHubProfile;
    const userExisted = await this.userRepo.getUserByGithubId(user.id);
    if(userExisted){
      const token
        = JWTHelper.generateToken({ userId: userExisted.id }, "ACCESS");
      const refresh_token = JWTHelper.generateToken({ userId: userExisted.id }, "REFRESH");
      CookieHelper.setCookie(CookieKeys.ACCESS_TOKEN, token, response);
      CookieHelper.setCookie(CookieKeys.REFRESH, refresh_token, response);
      return response.json({ token, refresh_token });
    } else {
      if((await this.userRepo.getUserByEmail(user.email.split("@")[0] + "+vtcapp" + user.email.split("@")[1]))){
        return next(new HttpException(400, "Email already existed"));
      }
      let userCreate = await this.userRepo.createUser({
        firstName: "",
        lastName: user.displayName,
        loginName: uuidv4(),
        email: user.email.split("@")[0] + "+vtcapp_github@" + user.email.split("@")[1],
        password: hashSync(uuidv4(), BYCRYPT_SALT),
        isEmailVertify: false,
        status: true,
        githubId: user.id,
      });
      const token = JWTHelper.generateToken({ userId: userCreate.id }, "ACCESS");
      const refresh_token = JWTHelper.generateToken({ userId: userCreate.id }, "REFRESH");
      CookieHelper.setCookie(CookieKeys.ACCESS_TOKEN, token, response);
      CookieHelper.setCookie(CookieKeys.REFRESH, refresh_token, response);
      return response.json({ token, refresh_token });
    }
  };

  resendEmailVertify = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
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
    if(user.isEmailVertify){
      return next(new HttpException(400, "Email is already vertify"));
    }
    const vertifyToken = await JWTHelper.generateToken(
      { userId: user.id },
      "VERTIFY_EMAIL",
    );
    setImmediate(() => {
      EmailAuthenticatedUser({ user: { loginName: user.loginName, email }, vertifyToken });
    });
    response.json({ message: "Successful email person" });
  }

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
  }
}

type GoogleProfile = {
  id: string,
  name: {
    familyName: string,
    givenName: string,
  },
  emails: {value: string, verified: boolean}[],
  photos: {value: string}[],
}

type GitHubProfile = {
  id: string,
  displayName: string,
  username: string,
  profileUrl: string,
  photos: {value: string}[],
  email: string,
}
