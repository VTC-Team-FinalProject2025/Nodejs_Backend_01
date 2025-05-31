import { Request } from 'express';
import redisClient from '../configs/redis';

export class CacheHelper {
  private static instance: CacheHelper;
  private readonly CACHE_EXPIRATION = 3600; // 1 hour in seconds

  private constructor() {}

  public static getInstance(): CacheHelper {
    if (!CacheHelper.instance) {
      CacheHelper.instance = new CacheHelper();
    }
    return CacheHelper.instance;
  }

  public getCacheKey(req: Request, basePath: string): string {
    const params = req.params;
    const query = req.query;
    
    // Remove any existing /api prefix to avoid duplication
    let key = basePath.replace(/^\/api/, '');
    // Add /api prefix
    key = `/api${key}`;
    
    if (Object.keys(params).length > 0) {
      key += '/' + Object.values(params).join('/');
    }
    
    // Add query parameters if they exist
    if (Object.keys(query).length > 0) {
      const queryString = Object.entries(query)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      key += `?${queryString}`;
    }
    
    return key;
  }

  public async setCache(key: string, data: any): Promise<void> {
    try {
      await redisClient.set(key, JSON.stringify(data), {
        EX: this.CACHE_EXPIRATION
      });
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  public async getCache(key: string): Promise<any> {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  public async clearCache(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  public async clearRelatedCache(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error('Error clearing related cache:', error);
    }
  }

  public async setResponseCache(req: Request, basePath: string, data: any): Promise<void> {
    const cacheKey = this.getCacheKey(req, basePath);
    console.log('Cache key:', cacheKey);
    await this.setCache(cacheKey, data);
  }
}

// Export singleton instance
export const cacheHelper = CacheHelper.getInstance();

// Export individual functions for backward compatibility
export const setCache = (key: string, data: any) => cacheHelper.setCache(key, data);
export const getCache = (key: string) => cacheHelper.getCache(key);
export const clearCache = (key: string) => cacheHelper.clearCache(key);
export const clearRelatedCache = (pattern: string) => cacheHelper.clearRelatedCache(pattern);
