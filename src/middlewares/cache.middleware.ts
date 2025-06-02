import { Request, Response, NextFunction } from "express";
import { cacheHelper } from "../helpers/Cache";

export const cache = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get userId from request if available
    const userId = req.user?.userId;

    // Create cache key with userId if available
    const cacheKey = userId ? `${req.baseUrl}_${userId}` : req.baseUrl;

    const cachedData = await cacheHelper.getCache(cacheKey);

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    } else {
      next();
    }
  } catch (error) {
    console.error("Cache middleware error:", error);
    next();
  }
};
