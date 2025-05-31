import { Request, Response, NextFunction } from 'express';
import { cacheHelper } from '../helpers/Cache';

export const cache = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get userId from request if available
    const userId = req.user?.userId;
    
    // Create cache key with userId if available
    const cacheKey = userId 
      ? `${req.baseUrl}_${userId}`
      : req.baseUrl;
      
    const cachedData = await cacheHelper.getCache(cacheKey);

    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method
    res.json = function(data: any) {
      // Cache the response data with user-specific key
      cacheHelper.setCache(cacheKey, data).catch(console.error);
      
      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Cache middleware error:', error);
    next();
  }
};