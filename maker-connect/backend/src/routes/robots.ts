import { Router, Response } from 'express';
import { robotService } from '../services/robot.service';
import { AppError } from '../middleware/errorHandler';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';

export const robotsRouter = Router();

// POST /robots/models - Create robot model (protected)
robotsRouter.post('/models', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const {
      name,
      description,
      hardware_stack,
      software_stack,
      dimensions,
      weight,
      max_speed,
      sensors,
      actuators,
      power_source,
    } = req.body;

    const model = await robotService.createRobotModel(req.user.userId, {
      name,
      description,
      hardware_stack,
      software_stack,
      dimensions,
      weight,
      max_speed,
      sensors,
      actuators,
      power_source,
    });

    res.status(201).json({
      data: model,
      message: 'Robot model created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
      });
    }
    throw error;
  }
});

// GET /robots/models - List robot models (optional auth)
robotsRouter.get('/models', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const search = req.query.search as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const sort = (req.query.sort as string) || 'newest';

    const { models, total } = await robotService.listRobotModels({
      search,
      limit,
      offset,
      sort: sort as 'newest' | 'trending' | 'popular',
    });

    res.status(200).json({
      data: {
        models,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
      });
    }
    throw error;
  }
});

// GET /robots/models/:id - Get robot model details
robotsRouter.get('/models/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const modelId = parseInt(req.params.id);

    if (isNaN(modelId)) {
      throw new AppError(400, 'Invalid model ID');
    }

    const model = await robotService.getRobotModelById(modelId);

    res.status(200).json({
      data: model,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
      });
    }
    throw error;
  }
});

// POST /robots/instances - Create robot instance (protected)
robotsRouter.post('/instances', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { model_id, name, serial_number, firmware_version, customizations } = req.body;

    const instance = await robotService.createRobotInstance({
      model_id,
      owner_id: req.user.userId,
      name,
      serial_number,
      firmware_version,
      customizations,
    });

    res.status(201).json({
      data: instance,
      message: 'Robot instance created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
      });
    }
    throw error;
  }
});

// GET /robots/instances/:id - Get robot instance details
robotsRouter.get('/instances/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const instanceId = parseInt(req.params.id);

    if (isNaN(instanceId)) {
      throw new AppError(400, 'Invalid instance ID');
    }

    const instance = await robotService.getRobotInstanceById(instanceId);

    res.status(200).json({
      data: instance,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
      });
    }
    throw error;
  }
});

// POST /robots/instances/:id/matches - Record match (protected)
robotsRouter.post('/instances/:id/matches', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const instanceId = parseInt(req.params.id);

    if (isNaN(instanceId)) {
      throw new AppError(400, 'Invalid instance ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { opponent_instance_id, match_type, environment, result, score, opponent_score, duration_seconds, notes } =
      req.body;

    const match = await robotService.recordMatch(instanceId, {
      opponent_instance_id,
      match_type,
      environment,
      result,
      score,
      opponent_score,
      duration_seconds,
      notes,
    });

    res.status(201).json({
      data: match,
      message: 'Match recorded successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
      });
    }
    throw error;
  }
});

// GET /robots/instances/:id/matches - Get instance matches
robotsRouter.get('/instances/:id/matches', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const instanceId = parseInt(req.params.id);
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    if (isNaN(instanceId)) {
      throw new AppError(400, 'Invalid instance ID');
    }

    const matches = await robotService.getInstanceMatches(instanceId, limit, offset);

    res.status(200).json({
      data: matches,
      limit,
      offset,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
      });
    }
    throw error;
  }
});

// GET /robots/rankings - Get robot rankings
robotsRouter.get('/rankings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

    const rankings = await robotService.getRankings(limit, offset);

    res.status(200).json({
      data: rankings,
      limit,
      offset,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
      });
    }
    throw error;
  }
});

// POST /robots/rankings/refresh - Refresh rankings (admin or cron job)
robotsRouter.post('/rankings/refresh', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // In production, add admin check here
    // if (!isAdmin(req.user)) { throw new AppError(403, 'Admin only'); }

    await robotService.updateRankings();

    res.status(200).json({
      message: 'Rankings refreshed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
      });
    }
    throw error;
  }
});
