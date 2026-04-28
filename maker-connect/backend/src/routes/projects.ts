import { Router, Response } from 'express';
import { projectService } from '../services/project.service';
import { AppError } from '../middleware/errorHandler';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';

export const projectsRouter = Router();

// GET /projects - List projects with filters (optional auth)
projectsRouter.get('/', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const category = req.query.category as string;
    const difficulty = req.query.difficulty as string;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const sort = (req.query.sort as string) || 'newest';

    const { projects, total } = await projectService.listProjects(
      {
        category,
        difficulty,
        status,
        search,
        limit,
        offset,
        sort: sort as 'newest' | 'trending' | 'popular',
      },
      req.user?.userId
    );

    res.status(200).json({
      data: {
        projects,
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

// POST /projects - Create new project (protected)
projectsRouter.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { title, description, category, difficulty_level, estimated_hours, budget, status, is_public } = req.body;

    const project = await projectService.createProject(req.user.userId, {
      title,
      description,
      category,
      difficulty_level,
      estimated_hours,
      budget,
      status,
      is_public,
    });

    res.status(201).json({
      data: project,
      message: 'Project created successfully',
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

// GET /projects/:id - Get project details (optional auth)
projectsRouter.get('/:id', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const project = await projectService.getProjectById(projectId, req.user?.userId);

    res.status(200).json({
      data: project,
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

// PUT /projects/:id - Update project (protected, owner only)
projectsRouter.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { title, description, category, difficulty_level, estimated_hours, budget, status, is_public } = req.body;

    const project = await projectService.updateProject(projectId, req.user.userId, {
      title,
      description,
      category,
      difficulty_level,
      estimated_hours,
      budget,
      status,
      is_public,
    });

    res.status(200).json({
      data: project,
      message: 'Project updated successfully',
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

// DELETE /projects/:id - Delete project (protected, owner only)
projectsRouter.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    await projectService.deleteProject(projectId, req.user.userId);

    res.status(200).json({
      message: 'Project deleted successfully',
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

// POST /projects/:id/fork - Fork project (protected)
projectsRouter.post('/:id/fork', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { title } = req.body;

    const forkedProject = await projectService.forkProject(projectId, req.user.userId, title);

    res.status(201).json({
      data: forkedProject,
      message: 'Project forked successfully',
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

// POST /projects/:id/components - Add component (protected, owner only)
projectsRouter.post('/:id/components', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { name, part_number, quantity, unit_cost, supplier, datasheet_url, notes } = req.body;

    const component = await projectService.addComponent(projectId, req.user.userId, {
      name,
      part_number,
      quantity,
      unit_cost,
      supplier,
      datasheet_url,
      notes,
    });

    res.status(201).json({
      data: component,
      message: 'Component added successfully',
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

// GET /projects/:id/components - Get project components
projectsRouter.get('/:id/components', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const components = await projectService.getComponents(projectId);

    res.status(200).json({
      data: components,
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

// POST /projects/:id/error-logs - Add error log (protected, owner only)
projectsRouter.post('/:id/error-logs', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { title, description, severity, resolution } = req.body;

    const errorLog = await projectService.addErrorLog(projectId, req.user.userId, {
      title,
      description,
      severity,
      resolution,
    });

    res.status(201).json({
      data: errorLog,
      message: 'Error log added successfully',
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

// GET /projects/:id/error-logs - Get error logs
projectsRouter.get('/:id/error-logs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    if (isNaN(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    const errorLogs = await projectService.getErrorLogs(projectId, limit, offset);

    res.status(200).json({
      data: errorLogs,
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

// POST /projects/:id/upvote - Upvote project (protected)
projectsRouter.post('/:id/upvote', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    await projectService.upvoteProject(projectId, req.user.userId);

    res.status(201).json({
      message: 'Project upvoted successfully',
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

// POST /projects/:id/downvote - Downvote project (protected)
projectsRouter.post('/:id/downvote', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    await projectService.downvoteProject(projectId, req.user.userId);

    res.status(201).json({
      message: 'Project downvoted successfully',
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

// POST /projects/:id/collaborators - Add collaborator (protected, owner only)
projectsRouter.post('/:id/collaborators', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      throw new AppError(400, 'Invalid project ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { collaborator_id, role } = req.body;

    await projectService.addCollaborator(projectId, req.user.userId, collaborator_id, role);

    res.status(201).json({
      message: 'Collaborator added successfully',
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

// DELETE /projects/:id/collaborators/:collaborator_id - Remove collaborator (protected, owner only)
projectsRouter.delete('/:id/collaborators/:collaborator_id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const collaboratorId = parseInt(req.params.collaborator_id);

    if (isNaN(projectId) || isNaN(collaboratorId)) {
      throw new AppError(400, 'Invalid project or collaborator ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    await projectService.removeCollaborator(projectId, req.user.userId, collaboratorId);

    res.status(200).json({
      message: 'Collaborator removed successfully',
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
