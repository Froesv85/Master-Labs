import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { postsRouter } from './routes/posts';
import { projectsRouter } from './routes/projects';
import { robotsRouter } from './routes/robots';
import { teamsRouter } from './routes/teams';
import { communitiesRouter } from './routes/communities';
import { socialRouter } from './routes/social';
import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logging middleware
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// Routes
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/posts', postsRouter);
app.use('/projects', projectsRouter);
app.use('/robots', robotsRouter);
app.use('/teams', teamsRouter);
app.use('/communities', communitiesRouter);
app.use('/api/v1/social', socialRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
let server: any;

async function start() {
  try {
    // Initialize database connection
    await initializeDatabase();
    logger.info('✅ Database connected');

    // Initialize Redis connection
    await initializeRedis();
    logger.info('✅ Redis connected');

    // Start server
    server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  }
});

start();

export default app;
