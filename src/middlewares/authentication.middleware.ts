import { NextFunction, Request, Response } from "express";
import HttpException from "../exceptions/http-exception";
import JWTHelper, { AuthTokenPayload } from "../helpers/JWT";
import Cookie from "../helpers/Cookie";
import { CookieKeys } from "../constants";
import UserRepository from "../repositories/UserRepository";
import { Prisma, PrismaClient } from "@prisma/client";

export default async function authMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
    const { authorization } = request.headers;
    let tokenPayload;
    let token;
    try{
        if (authorization && (authorization.includes('Bearer') || authorization.includes('bearer'))) {
            token = authorization.trim().split(' ')[1];
        } else if(authorization){
            token = authorization.trim();
        } else if(request.cookies.token) {
            token = request.cookies.token;
        }
        if(!token) throw new Error("Token not found");
        tokenPayload = JWTHelper.verifyToken(token, "ACCESS");
        request.user = tokenPayload;
        return next();
    } catch (error: any) {
        let refreshToken = request.cookies.refresh_token;
        // xử lý khi token hết hạn
        if (refreshToken) {
            try {
              // nếu không vertify được thì sẽ throw ra error
              const refreshPayload = JWTHelper.verifyToken(refreshToken, "REFRESH") as AuthTokenPayload;
      
              // Tạo lại Access Token
              const newAccessToken = JWTHelper.generateToken(
                {userId: refreshPayload.userId},
                "ACCESS"
              );
              const newRefreshToken = JWTHelper.generateToken(
                {userId: refreshPayload.userId},
                "REFRESH"
              );
              
              const userRepo = new UserRepository(new PrismaClient());
              const user = await userRepo.getUserById(refreshPayload.userId);
              if(!user) throw new Error("User not found");
              // Set lại Token vào cookies
              Cookie.setCookie(CookieKeys.ACCESS_TOKEN, newAccessToken, response);
              Cookie.setCookie(CookieKeys.REFRESH, newRefreshToken, response, {httpOnly: true, maxAge: 7 * 24* 60 * 60 * 1000});
              Cookie.setCookie(
                CookieKeys.USER_INFO,
                JSON.stringify({ userId: user.id, avatarUrl: user.avatarUrl, loginName: user.loginName, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone }),
                response,
                {httpOnly: false, maxAge:  7 * 24* 60 * 60 * 1000}
              );
              request.user = refreshPayload;
              return next();
            } catch (refreshError) {

            }
        }
        return next(new HttpException(401, "Unauthorized"));
    }
}

export const AuthMiddleware = authMiddleware;
