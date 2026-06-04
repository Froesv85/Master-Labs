import { Router, Response } from 'express';
import { userService } from '../services/user.service';
import { AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

export const usersRouter = Router();

// GET /users/:id/profile - Public endpoint
usersRouter.get('/:id/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      throw new AppError(400, 'Invalid user ID');
    }

    const profile = await userService.getProfileById(userId);

    res.status(200).json({
      data: profile,
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

// PUT /users/:id/profile - Protected endpoint
usersRouter.put('/:id/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      throw new AppError(400, 'Invalid user ID');
    }

    // Check authorization (can only update own profile)
    if (req.user?.userId !== userId) {
      throw new AppError(403, 'You can only update your own profile');
    }

    const { display_name, bio, avatar_url, github_url, portfolio_url, expertise_areas, years_of_experience } = req.body;

    const profile = await userService.updateProfile(userId, {
      display_name,
      bio,
      avatar_url,
      github_url,
      portfolio_url,
      expertise_areas,
      years_of_experience,
    });

    res.status(200).json({
      data: profile,
      message: 'Profile updated successfully',
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

// POST /users/:id/follow - Protected endpoint
usersRouter.post('/:id/follow', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const followingId = parseInt(req.params.id);

    if (isNaN(followingId)) {
      throw new AppError(400, 'Invalid user ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    await userService.followUser(req.user.userId, followingId);

    res.status(201).json({
      message: 'User followed successfully',
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

// DELETE /users/:id/follow - Protected endpoint
usersRouter.delete('/:id/follow', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const followingId = parseInt(req.params.id);

    if (isNaN(followingId)) {
      throw new AppError(400, 'Invalid user ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    await userService.unfollowUser(req.user.userId, followingId);

    res.status(200).json({
      message: 'User unfollowed successfully',
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

// GET /users/:id/followers - Public endpoint
usersRouter.get('/:id/followers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    if (isNaN(userId)) {
      throw new AppError(400, 'Invalid user ID');
    }

    const followers = await userService.getFollowers(userId, limit, offset);

    res.status(200).json({
      data: followers,
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

// GET /users/:id/following - Public endpoint
usersRouter.get('/:id/following', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    if (isNaN(userId)) {
      throw new AppError(400, 'Invalid user ID');
    }

    const following = await userService.getFollowing(userId, limit, offset);

    res.status(200).json({
      data: following,
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

// GET /users/:id/check-following/:targetId - Check if following
usersRouter.get('/:id/check-following/:targetId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const targetId = parseInt(req.params.targetId);

    if (isNaN(userId) || isNaN(targetId)) {
      throw new AppError(400, 'Invalid user ID');
    }

    // Check authorization
    if (req.user?.userId !== userId) {
      throw new AppError(403, 'You can only check your own follows');
    }

    const isFollowing = await userService.checkFollowing(userId, targetId);

    res.status(200).json({
      data: { is_following: isFollowing },
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
