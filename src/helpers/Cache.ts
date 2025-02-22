import redisClient from '../configs/redis';

export const getCache = async (key: string): Promise<string | null> => {
    try {
        return await redisClient.get(key);
    } catch (error) {
        console.error('Cache error:', error);
        return null;
    }
}

export const setCache = async (key: string, data: unknown, expiration: number = 3600): Promise<void> => {
    try {
        await redisClient.set(key, JSON.stringify(data), { EX: expiration });
    } catch (error) {
        console.error('Cache set error:', error);
    }
}

export const updateCache = async (key: string, data: unknown, expiration: number = 3600): Promise<void> => {
    try {
        await redisClient.set(key, JSON.stringify(data), { EX: expiration });
    } catch (error) {
        console.error('Cache update error:', error);
    }
}

export const clearCache = async (key: string): Promise<void> => {
    try {
        await redisClient.del(key); 
    } catch (error) {
        console.error('Cache clear error:', error);
    }
}

export const clearRelatedCache = async (pattern: string): Promise<void> => {
    try {
        let cursor = 0;
        do {
            const result = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
            const newCursor = result.cursor;
            const keys = result.keys;

            cursor = newCursor;
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        } while (cursor !== 0);
    } catch (error) {
        console.error('Cache clear error:', error);
    }
};
