import { Router, Request, Response } from 'express';
import { getDatabase } from '../config/database';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

export const healthRouter = Router();

interface HealthCheck {
  status: 'ok' | 'degraded' | 'down';
  message: string;
  responseTime?: number;
}

interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  components: {
    api: HealthCheck;
    database: HealthCheck;
    redis: HealthCheck;
  };
}

healthRouter.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    components: {
      api: { status: 'ok', message: 'API is running' },
      database: { status: 'ok', message: 'Database connection ok' },
      redis: { status: 'ok', message: 'Redis connection ok' },
    },
  };

  try {
    // Check database
    try {
      const dbStartTime = Date.now();
      const db = getDatabase();
      await db.raw('SELECT 1');
      response.components.database.responseTime = Date.now() - dbStartTime;
    } catch (error) {
      response.components.database = {
        status: 'down',
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown'}`,
      };
      response.status = 'degraded';
      logger.warn('Health check: Database down');
    }

    // Check Redis
    try {
      const redisStartTime = Date.now();
      const redis = getRedisClient();
      await redis.ping();
      response.components.redis.responseTime = Date.now() - redisStartTime;
    } catch (error) {
      response.components.redis = {
        status: 'down',
        message: `Redis error: ${error instanceof Error ? error.message : 'Unknown'}`,
      };
      response.status = 'degraded';
      logger.warn('Health check: Redis down');
    }

    const statusCode = response.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(500).json({
      status: 'down',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});
