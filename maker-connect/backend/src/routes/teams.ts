import { Router, Response } from 'express';

import { teamService } from '../services/team.service';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const teamsRouter = Router();

// GET /teams
teamsRouter.get('/', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const visibility = req.query.visibility as 'public' | 'private' | undefined;
    const search = req.query.search as string;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const offset = parseInt(req.query.offset as string, 10) || 0;

    const result = await teamService.listTeams(
      {
        visibility,
        search,
        limit,
        offset,
      },
      req.user?.userId
    );

    res.status(200).json({
      data: {
        teams: result.teams,
        total: result.total,
        limit,
        offset,
        hasMore: offset + limit < result.total,
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

// POST /teams
teamsRouter.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { name, description, logo_url, visibility, max_members } = req.body;

    const team = await teamService.createTeam(req.user.userId, {
      name,
      description,
      logo_url,
      visibility,
      max_members,
    });

    res.status(201).json({
      data: team,
      message: 'Team created successfully',
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

// GET /teams/:id
teamsRouter.get('/:id', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    if (Number.isNaN(teamId)) {
      throw new AppError(400, 'Invalid team ID');
    }

    const team = await teamService.getTeamById(teamId, req.user?.userId);

    res.status(200).json({
      data: team,
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

// PUT /teams/:id
teamsRouter.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    if (Number.isNaN(teamId)) {
      throw new AppError(400, 'Invalid team ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { name, description, logo_url, visibility, max_members } = req.body;

    const team = await teamService.updateTeam(teamId, req.user.userId, {
      name,
      description,
      logo_url,
      visibility,
      max_members,
    });

    res.status(200).json({
      data: team,
      message: 'Team updated successfully',
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

// DELETE /teams/:id
teamsRouter.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    if (Number.isNaN(teamId)) {
      throw new AppError(400, 'Invalid team ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    await teamService.deleteTeam(teamId, req.user.userId);

    res.status(200).json({
      message: 'Team deleted successfully',
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

// GET /teams/:id/members
teamsRouter.get('/:id/members', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    if (Number.isNaN(teamId)) {
      throw new AppError(400, 'Invalid team ID');
    }

    const members = await teamService.listMembers(teamId);

    res.status(200).json({
      data: members,
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

// POST /teams/:id/members
teamsRouter.post('/:id/members', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    if (Number.isNaN(teamId)) {
      throw new AppError(400, 'Invalid team ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { user_id, role } = req.body;
    const members = await teamService.addMember(teamId, req.user.userId, {
      user_id,
      role,
    });

    res.status(201).json({
      data: members,
      message: 'Member added successfully',
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

// DELETE /teams/:id/members/:memberId
teamsRouter.delete('/:id/members/:memberId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const memberId = parseInt(req.params.memberId, 10);

    if (Number.isNaN(teamId) || Number.isNaN(memberId)) {
      throw new AppError(400, 'Invalid team ID or member ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const members = await teamService.removeMember(teamId, req.user.userId, memberId);

    res.status(200).json({
      data: members,
      message: 'Member removed successfully',
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

// GET /teams/:id/projects
teamsRouter.get('/:id/projects', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    if (Number.isNaN(teamId)) {
      throw new AppError(400, 'Invalid team ID');
    }

    const projects = await teamService.getTeamProjects(teamId);

    res.status(200).json({
      data: projects,
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

// POST /teams/:id/projects
teamsRouter.post('/:id/projects', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    if (Number.isNaN(teamId)) {
      throw new AppError(400, 'Invalid team ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const projectId = parseInt(req.body.project_id, 10);
    if (Number.isNaN(projectId)) {
      throw new AppError(400, 'Invalid project_id');
    }

    const projects = await teamService.addProject(teamId, req.user.userId, projectId);

    res.status(201).json({
      data: projects,
      message: 'Project linked to team successfully',
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

// DELETE /teams/:id/projects/:projectId
teamsRouter.delete('/:id/projects/:projectId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const projectId = parseInt(req.params.projectId, 10);

    if (Number.isNaN(teamId) || Number.isNaN(projectId)) {
      throw new AppError(400, 'Invalid team ID or project ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const projects = await teamService.removeProject(teamId, req.user.userId, projectId);

    res.status(200).json({
      data: projects,
      message: 'Project unlinked from team successfully',
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

// POST /teams/:id/invites
teamsRouter.post('/:id/invites', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    if (Number.isNaN(teamId)) {
      throw new AppError(400, 'Invalid team ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { email, role, expires_in_days } = req.body;

    const invite = await teamService.inviteMember(teamId, req.user.userId, {
      email,
      role,
      expires_in_days,
    });

    res.status(201).json({
      data: invite,
      message: 'Invite created successfully',
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

// GET /teams/:id/invites
teamsRouter.get('/:id/invites', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    if (Number.isNaN(teamId)) {
      throw new AppError(400, 'Invalid team ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const invites = await teamService.listInvites(teamId, req.user.userId);

    res.status(200).json({
      data: invites,
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
