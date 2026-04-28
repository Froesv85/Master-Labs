import { Router, Response } from 'express';
import { postService } from '../services/post.service';
import { AppError } from '../middleware/errorHandler';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';

export const postsRouter = Router();

// GET /posts/feed - Get social feed (optional auth for personalization)
postsRouter.get('/feed', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const sort = (req.query.sort as string) || 'newest';

    const { posts, total } = await postService.getFeed(
      { limit, offset, sort: sort as 'newest' | 'trending' | 'popular' },
      req.user?.userId
    );

    res.status(200).json({
      data: {
        posts,
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

// POST /posts - Create new post (protected)
postsRouter.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { title, content, content_type, media_urls, project_id, visibility } = req.body;

    const post = await postService.createPost(req.user.userId, {
      title,
      content,
      content_type,
      media_urls,
      project_id,
      visibility,
    });

    res.status(201).json({
      data: post,
      message: 'Post created successfully',
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

// GET /posts/:id - Get post details (optional auth)
postsRouter.get('/:id', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = parseInt(req.params.id);

    if (isNaN(postId)) {
      throw new AppError(400, 'Invalid post ID');
    }

    const post = await postService.getPostById(postId, req.user?.userId);

    res.status(200).json({
      data: post,
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

// POST /posts/:id/like - Like a post (protected)
postsRouter.post('/:id/like', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = parseInt(req.params.id);

    if (isNaN(postId)) {
      throw new AppError(400, 'Invalid post ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    await postService.likePost(postId, req.user.userId);

    res.status(201).json({
      message: 'Post liked successfully',
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

// DELETE /posts/:id/like - Unlike a post (protected)
postsRouter.delete('/:id/like', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = parseInt(req.params.id);

    if (isNaN(postId)) {
      throw new AppError(400, 'Invalid post ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    await postService.unlikePost(postId, req.user.userId);

    res.status(200).json({
      message: 'Post unliked successfully',
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

// POST /posts/:id/comments - Add comment (protected)
postsRouter.post('/:id/comments', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = parseInt(req.params.id);

    if (isNaN(postId)) {
      throw new AppError(400, 'Invalid post ID');
    }

    if (!req.user?.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { content } = req.body;

    const comment = await postService.addComment(postId, req.user.userId, content);

    res.status(201).json({
      data: comment,
      message: 'Comment added successfully',
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

// GET /posts/:id/comments - Get comments (optional auth)
postsRouter.get('/:id/comments', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    if (isNaN(postId)) {
      throw new AppError(400, 'Invalid post ID');
    }

    const comments = await postService.getComments(postId, limit, offset);

    res.status(200).json({
      data: comments,
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
