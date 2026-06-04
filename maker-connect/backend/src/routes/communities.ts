import { Router, Response } from 'express';

import { communityService } from '../services/community.service';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const communitiesRouter = Router();

// GET /communities
communitiesRouter.get('/', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const category = req.query.category as 'robotics' | '3d-printing' | 'iot' | 'woodworking' | undefined;
    const visibility = req.query.visibility as 'public' | 'private' | undefined;
    const search = req.query.search as string;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const offset = parseInt(req.query.offset as string, 10) || 0;

    const result = await communityService.listCommunities(
      {
        category,
        visibility,
        search,
        limit,
        offset,
      },
      req.user?.userId
    );

    res.status(200).json({
      data: {
        communities: result.communities,
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

// POST /communities
communitiesRouter.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { name, description, category, icon_url, visibility } = req.body;

    const community = await communityService.createCommunity(req.user.userId, {
      name,
      description,
      category,
      icon_url,
      visibility,
    });

    res.status(201).json({
      data: community,
      message: 'Community created successfully',
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

// GET /communities/:id
communitiesRouter.get('/:id', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const communityId = parseInt(req.params.id, 10);
    if (Number.isNaN(communityId)) {
      throw new AppError(400, 'Invalid community ID');
    }

    const community = await communityService.getCommunityById(communityId, req.user?.userId);

    res.status(200).json({
      data: community,
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

// PUT /communities/:id
communitiesRouter.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const communityId = parseInt(req.params.id, 10);
    if (Number.isNaN(communityId)) {
      throw new AppError(400, 'Invalid community ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { name, description, category, icon_url, visibility } = req.body;

    const community = await communityService.updateCommunity(communityId, req.user.userId, {
      name,
      description,
      category,
      icon_url,
      visibility,
    });

    res.status(200).json({
      data: community,
      message: 'Community updated successfully',
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

// DELETE /communities/:id
communitiesRouter.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const communityId = parseInt(req.params.id, 10);
    if (Number.isNaN(communityId)) {
      throw new AppError(400, 'Invalid community ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    await communityService.deleteCommunity(communityId, req.user.userId);

    res.status(200).json({
      message: 'Community deleted successfully',
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

// POST /communities/:id/members/join
communitiesRouter.post('/:id/members/join', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const communityId = parseInt(req.params.id, 10);
    if (Number.isNaN(communityId)) {
      throw new AppError(400, 'Invalid community ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const community = await communityService.joinCommunity(communityId, req.user.userId);

    res.status(200).json({
      data: community,
      message: 'Joined community successfully',
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

// DELETE /communities/:id/members/leave
communitiesRouter.delete('/:id/members/leave', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const communityId = parseInt(req.params.id, 10);
    if (Number.isNaN(communityId)) {
      throw new AppError(400, 'Invalid community ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const community = await communityService.leaveCommunity(communityId, req.user.userId);

    res.status(200).json({
      data: community,
      message: 'Left community successfully',
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

// GET /communities/:id/members
communitiesRouter.get('/:id/members', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const communityId = parseInt(req.params.id, 10);
    if (Number.isNaN(communityId)) {
      throw new AppError(400, 'Invalid community ID');
    }

    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);
    const offset = parseInt(req.query.offset as string, 10) || 0;

    const members = await communityService.listMembers(communityId, limit, offset);

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

// POST /communities/:id/discussions
communitiesRouter.post('/:id/discussions', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const communityId = parseInt(req.params.id, 10);
    if (Number.isNaN(communityId)) {
      throw new AppError(400, 'Invalid community ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { title, content, tags, pinned } = req.body;

    const discussion = await communityService.startDiscussion(communityId, req.user.userId, {
      title,
      content,
      tags,
      pinned,
    });

    res.status(201).json({
      data: discussion,
      message: 'Discussion created successfully',
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

// GET /communities/:id/discussions
communitiesRouter.get('/:id/discussions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const communityId = parseInt(req.params.id, 10);
    if (Number.isNaN(communityId)) {
      throw new AppError(400, 'Invalid community ID');
    }

    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const offset = parseInt(req.query.offset as string, 10) || 0;

    const discussions = await communityService.listDiscussions(communityId, limit, offset);

    res.status(200).json({
      data: {
        discussions,
        limit,
        offset,
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

// GET /communities/:id/discussions/:discussionId
communitiesRouter.get('/:id/discussions/:discussionId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const communityId = parseInt(req.params.id, 10);
    const discussionId = parseInt(req.params.discussionId, 10);

    if (Number.isNaN(communityId) || Number.isNaN(discussionId)) {
      throw new AppError(400, 'Invalid community ID or discussion ID');
    }

    const discussion = await communityService.getDiscussionById(communityId, discussionId);

    res.status(200).json({
      data: discussion,
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

// POST /communities/:id/knowledge
communitiesRouter.post('/:id/knowledge', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const communityId = parseInt(req.params.id, 10);
    if (Number.isNaN(communityId)) {
      throw new AppError(400, 'Invalid community ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { title, content, source_type, source_id, metadata } = req.body;

    const item = await communityService.addKnowledgeItem(communityId, req.user.userId, {
      title,
      content,
      source_type,
      source_id,
      metadata,
    });

    res.status(201).json({
      data: item,
      message: 'Knowledge item added successfully',
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

// GET /communities/:id/knowledge
communitiesRouter.get('/:id/knowledge', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const communityId = parseInt(req.params.id, 10);
    if (Number.isNaN(communityId)) {
      throw new AppError(400, 'Invalid community ID');
    }

    const sourceType = req.query.source_type as 'post' | 'project' | 'discussion' | 'documentation' | undefined;
    const search = req.query.search as string;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const offset = parseInt(req.query.offset as string, 10) || 0;

    const result = await communityService.listKnowledgeItems(communityId, {
      source_type: sourceType,
      search,
      limit,
      offset,
    });

    res.status(200).json({
      data: {
        items: result.items,
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

// GET /communities/:id/knowledge/search
communitiesRouter.get('/:id/knowledge/search', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const communityId = parseInt(req.params.id, 10);
    if (Number.isNaN(communityId)) {
      throw new AppError(400, 'Invalid community ID');
    }

    const query = (req.query.q as string) || '';
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 10, 50);

    const result = await communityService.listKnowledgeItems(communityId, {
      search: query,
      limit,
      offset: 0,
    });

    res.status(200).json({
      data: {
        query,
        results: result.items,
        total: result.total,
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
