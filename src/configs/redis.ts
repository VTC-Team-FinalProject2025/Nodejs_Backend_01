import { createClient } from 'redis';
import {REDIS_URI} from '../constants'

const redisClient = createClient({
  url: REDIS_URI,
});

// Connect to Redis
redisClient.connect().catch(console.error);

// Handle connection errors
redisClient.on('error', (err) => console.error('Redis Client Error', err));

export default redisClient;