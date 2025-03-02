import express from "express";
import { BaseController } from "./abstractions/base-controller";
import HttpException from "../exceptions/http-exception";
import bcrypt, { hashSync } from "bcrypt";
import JWTHelper from "../helpers/JWT";
import ValidateSchema from "../middlewares/validateSchema.middleware";
import { SignupFormSchema, LoginFormSchema, ForgetPasswordFormSchema } from "../schemas/auth";
import SendEmailResetPassword from "../emails/emailForgotPassword.email";
import { CookieKeys, URL_CLIENT } from "../constants";
import CookieHelper from "../helpers/Cookie";
import ValidatorHelper from "../helpers/Validator";
import { BYCRYPT_SALT } from "../constants";
import EmailAuthenticatedUser from "../emails/emailAuthenticatedUser";
import UserRepository from "../repositories/UserRepository";
import { v4 as uuidv4} from "uuid";

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

export default class AuthController extends BaseController {
  public userRepo : UserRepository;
  public passport;
  constructor(userRepo: UserRepository, passport : any) {
    super();
    this.path = "/auth";
    this.userRepo = userRepo;
    this.passport = passport;
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.post("/login",
      ValidateSchema(LoginFormSchema),
      this.login,
    );
    this.router.post(
      "/signup",
      ValidateSchema(SignupFormSchema),
      this.signup,
    );
    this.router.post("/verify-email", this.vertifyEmail);
    this.router.post("/logout", this.logout);
    this.router.post("/forgot-password", this.forgotPassword);
    this.router.post("/reset-password", ValidateSchema(ForgetPasswordFormSchema), this.resetPassword);
    this.router.post("/refresh-token", this.resetToken);
    this.router.get("/google", this.passport.authenticate("google", { scope: ["profile", "email"] }));
    this.router.get(
      "/google/callback",
      this.passport.authenticate("google", { session: false }),
      this.handleGoogleCallback,
    );

    this.router.get("/github", this.passport.authenticate("github", { scope: ["user:email"] }));
    this.router.get(
      "/github/callback",
      this.passport.authenticate("github", { session: false }),
      this.handleGitHubCallback,
    );
    this.router.post("/resend-verify-email", this.resendEmailVertify);
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
    this.setTokenIntoCookie(token, refresh_token, response, user);
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
    const vertifyToken = JWTHelper.generateToken(
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
      this.setTokenIntoCookie(token, refresh_token, response, userExisted);
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
      this.setTokenIntoCookie(token, refresh_token, response, userCreate);
    }
    return response.redirect(URL_CLIENT+'/main/me');
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
      this.setTokenIntoCookie(token, refresh_token, response, userExisted);

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
      this.setTokenIntoCookie(token, refresh_token, response, userCreate);
    }
    return response.redirect(URL_CLIENT+"/main/me");
  };

  resendEmailVertify = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const { email } = request.body;
    if (!email) {
      return next(new HttpException(400, {message: "Email not filled in", code: "EMAIL_NOT_FILLED"}));
    } else if (!ValidatorHelper.isEmail(email)) {
      return next(new HttpException(400, {message: "Not an email address", code: "NOT_AN_EMAIL"}));
    }
    let user = await this.userRepo.getUserByEmail(email);
    if (!user) {
      return next(new HttpException(404, {message: "This email does not exist", code: "EMAIL_NOT_EXIST"}));
    }
    if(user.isEmailVertify){
      return next(new HttpException(400, {message: "Email is already verify", code: "EMAIL_ALREADY_VERIFY"}));
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

    if (!payload?.userId) {
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
    this.setTokenIntoCookie(token, refresh_token, response, getUserById);
    response.json({ token, refresh_token });
  }
  setTokenIntoCookie = (token: string, refresh_token: string, response: express.Response, user: any) => {
    CookieHelper.setCookie(CookieKeys.ACCESS_TOKEN, token, response);
    CookieHelper.setCookie(CookieKeys.REFRESH, refresh_token, response, {httpOnly: true, maxAge: 7 * 24* 60 * 60 * 1000});
    CookieHelper.setCookie(
      CookieKeys.USER_INFO,
      JSON.stringify({ userId: user.id, avatarUrl: user.avatarUrl, loginName: user.loginName, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone }),
      response,
      {httpOnly: false, maxAge: 7 * 24* 60 * 60 * 1000}
    );
  }
}

