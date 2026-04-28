import { createClient } from 'redis';
import { logger } from '../utils/logger';

let redisClient: ReturnType<typeof createClient>;

export async function initializeRedis(): Promise<ReturnType<typeof createClient>> {
  try {
    const url = `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

    redisClient = createClient({
      url,
      password: process.env.REDIS_PASSWORD,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error', { error: err });
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    await redisClient.connect();
    logger.info('Redis connection established');
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
    throw error;
  }
}

export function getRedisClient(): ReturnType<typeof createClient> {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
}
