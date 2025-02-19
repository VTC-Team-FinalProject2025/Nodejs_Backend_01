import { NextFunction, Request, Response } from "express";
import HttpException from "../exceptions/http-exception";
import JWTHelper from "../helpers/JWT";

export default function authMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
    const { authorization } = request.headers;
    let tokenPayload;
    if (authorization && authorization.includes('Bearer')) {
        let token = authorization.trim().split(' ')[1];
        tokenPayload = JWTHelper.verifyToken(token, "ACCESS");
        request.user = tokenPayload;
        return next();
    } else if(authorization){
        let token = authorization.trim();
        tokenPayload = JWTHelper.verifyToken(token, "ACCESS")
        request.user = tokenPayload;
        return next();
    }
    return next(new HttpException(401, "Unauthorized"));
}
