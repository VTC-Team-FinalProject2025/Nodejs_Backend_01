import { createClient } from 'redis';
import {REDIS_URI} from '../constants'

const redisClient = createClient({
  url: REDIS_URI,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis max retries reached');
        return new Error('Redis max retries reached');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

// Connect to Redis
redisClient.connect().catch(console.error);

// Handle connection errors
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
  // Try to reconnect
  if (!redisClient.isOpen) {
    redisClient.connect().catch(console.error);
  }
});

// Handle successful connection
redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

// Handle reconnection
redisClient.on('reconnecting', () => {
  console.log('Redis Client Reconnecting...');
});

export default redisClient;