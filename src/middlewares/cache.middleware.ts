import { getCache } from '../helpers/Cache';
import { NextFunction, Request, Response } from "express";

export const cache = async (
    request: Request,
    response: Response,
    next: NextFunction,
) => {
    const key = request.originalUrl;

    try {
        const cacheData = await getCache(key);
        if (cacheData) {
            return response.json(JSON.parse(cacheData));
        }
    } catch (error) {
        console.log('Cache error:', error);
        next();
    }
};