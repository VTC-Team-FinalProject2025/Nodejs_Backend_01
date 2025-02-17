import { NextFunction, Request, Response } from "express";
import { JWT_SECRET, JWT_SECRET_REFRESH, JWT_SECRET_RESET_PASSWORD } from "../secrets";
import * as jwt from "jsonwebtoken";
import HttpException from "../exceptions/http-exception";

interface TokenPayload {
  [key: string]: any;
}
export function GenerateToken(payload: TokenPayload, next: NextFunction) {
  try {
    const token: string = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
    return token;
  } catch (error) {
    return next(new HttpException(500, "Error creating token"));
  }
}

export function GenerateRefreshToken(
  payload: TokenPayload,
  next: NextFunction,
) {
  try {
    const token: string = jwt.sign(payload, JWT_SECRET_REFRESH, {
      expiresIn: "7 days",
    });
    return token;
  } catch (error) {
    return next(new HttpException(500, "Error creating refresh token"));
  }
}

export function GenerateResetPasswordToken(
  payload: TokenPayload,
  next: NextFunction,
) {
  try {
    const token: string = jwt.sign(payload, JWT_SECRET_RESET_PASSWORD, {
      expiresIn: "5m",
    });
    return token;
  } catch (error) {
    return next(new HttpException(500, "Error creating refresh token"));
  }
}
