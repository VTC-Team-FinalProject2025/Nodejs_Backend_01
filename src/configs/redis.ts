import { createClient } from 'redis';
import {REDIS_URI} from '../constants'

const redisClient = createClient({
  url: REDIS_URI,
});

export default redisClient;