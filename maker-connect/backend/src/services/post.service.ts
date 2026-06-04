import { getDatabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface CreatePostPayload {
  title: string;
  content: string;
  content_type?: 'text' | 'image' | 'video' | 'project_update';
  media_urls?: string[];
  project_id?: number;
  visibility?: 'public' | 'followers' | 'private';
}

interface PostResponse {
  id: number;
  user_id: number;
  user: {
    id: number;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  title: string;
  content: string;
  content_type: string;
  media_urls?: string[];
  visibility: string;
  status: string;
  engagement_score: number;
  like_count: number;
  comment_count: number;
  liked_by_me?: boolean;
  created_at: Date;
  updated_at: Date;
}

interface FeedFilters {
  category?: string;
  visibility?: string;
  limit?: number;
  offset?: number;
  sort?: 'newest' | 'trending' | 'popular';
}

export class PostService {
  private db = getDatabase();

  async createPost(userId: number, payload: CreatePostPayload): Promise<PostResponse> {
    try {
      // Validations
      if (!payload.title || !payload.content) {
        throw new AppError(400, 'Title and content are required');
      }

      if (payload.title.length > 255) {
        throw new AppError(400, 'Title must be less than 255 characters');
      }

      // Check if project exists (if provided)
      if (payload.project_id) {
        const project = await this.db('projects')
          .where('id', payload.project_id)
          .first();

        if (!project) {
          throw new AppError(404, 'Project not found');
        }
      }

      // Create post
      const [postId] = await this.db('posts').insert({
        user_id: userId,
        project_id: payload.project_id,
        title: payload.title,
        content: payload.content,
        content_type: payload.content_type || 'text',
        media_urls: payload.media_urls || null,
        visibility: payload.visibility || 'public',
        status: 'published',
        engagement_score: 0,
        created_at: new Date(),
        updated_at: new Date(),
      });

      return this.getPostById(postId, userId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to create post', { error, userId, payload });
      throw new AppError(500, 'Failed to create post', { error: String(error) });
    }
  }

  async getPostById(postId: number, currentUserId?: number): Promise<PostResponse> {
    try {
      const post = await this.db('posts')
        .join('users', 'posts.user_id', 'users.id')
        .where('posts.id', postId)
        .select('posts.*', 'users.username', 'users.display_name', 'users.avatar_url')
        .first();

      if (!post) {
        throw new AppError(404, 'Post not found');
      }

      // Get counts
      const likeCount = await this.db('post_likes')
        .where('post_id', postId)
        .count('* as count')
        .first();

      const commentCount = await this.db('post_comments')
        .where('post_id', postId)
        .count('* as count')
        .first();

      // Check if current user liked it
      let likedByMe = false;
      if (currentUserId) {
        const like = await this.db('post_likes')
          .where('post_id', postId)
          .where('user_id', currentUserId)
          .first();
        likedByMe = !!like;
      }

      return {
        id: post.id,
        user_id: post.user_id,
        user: {
          id: post.user_id,
          username: post.username,
          display_name: post.display_name,
          avatar_url: post.avatar_url,
        },
        title: post.title,
        content: post.content,
        content_type: post.content_type,
        media_urls: post.media_urls,
        visibility: post.visibility,
        status: post.status,
        engagement_score: post.engagement_score || 0,
        like_count: likeCount?.count || 0,
        comment_count: commentCount?.count || 0,
        liked_by_me: likedByMe,
        created_at: post.created_at,
        updated_at: post.updated_at,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to fetch post', { error: String(error) });
    }
  }

  async getFeed(filters: FeedFilters, currentUserId?: number): Promise<{ posts: PostResponse[]; total: number }> {
    try {
      const limit = Math.min(filters.limit || 20, 100);
      const offset = filters.offset || 0;
      const sort = filters.sort || 'newest';

      let query = this.db('posts')
        .join('users', 'posts.user_id', 'users.id')
        .where('posts.status', 'published');

      // Filter by visibility
      if (currentUserId) {
        query = query.where((q) => {
          q.where('posts.visibility', 'public')
            .orWhere('posts.user_id', currentUserId)
            .orWhereIn('posts.user_id', (subquery) => {
              subquery
                .select('following_id')
                .from('user_follows')
                .where('follower_id', currentUserId);
            });
        });
      } else {
        query = query.where('posts.visibility', 'public');
      }

      // Apply sorting
      switch (sort) {
        case 'trending':
          query = query.orderBy('engagement_score', 'desc');
          break;
        case 'popular':
          query = query.orderBy('posts.created_at', 'desc');
          break;
        case 'newest':
        default:
          query = query.orderBy('posts.created_at', 'desc');
      }

      // Get total count
      const countResult = await this.db('posts')
        .where('posts.status', 'published')
        .count('* as count')
        .first();

      const total = countResult?.count || 0;

      // Get paginated results
      const posts = await query
        .select('posts.*', 'users.username', 'users.display_name', 'users.avatar_url')
        .limit(limit)
        .offset(offset);

      // Fetch detailed post info with counts
      const detailedPosts: PostResponse[] = [];
      for (const post of posts) {
        detailedPosts.push(await this.getPostById(post.id, currentUserId));
      }

      return { posts: detailedPosts, total };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to fetch feed', { error, filters });
      throw new AppError(500, 'Failed to fetch feed', { error: String(error) });
    }
  }

  async likePost(postId: number, userId: number): Promise<void> {
    try {
      // Check if post exists
      const post = await this.db('posts').where('id', postId).first();
      if (!post) {
        throw new AppError(404, 'Post not found');
      }

      // Check if already liked
      const existing = await this.db('post_likes')
        .where('post_id', postId)
        .where('user_id', userId)
        .first();

      if (existing) {
        throw new AppError(409, 'Already liked this post');
      }

      // Add like
      await this.db('post_likes').insert({
        post_id: postId,
        user_id: userId,
        created_at: new Date(),
      });

      // Update engagement score
      await this.db('posts')
        .where('id', postId)
        .increment('engagement_score', 1);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to like post', { error: String(error) });
    }
  }

  async unlikePost(postId: number, userId: number): Promise<void> {
    try {
      await this.db('post_likes')
        .where('post_id', postId)
        .where('user_id', userId)
        .delete();

      // Update engagement score
      await this.db('posts')
        .where('id', postId)
        .decrement('engagement_score', 1);
    } catch (error) {
      throw new AppError(500, 'Failed to unlike post', { error: String(error) });
    }
  }

  async addComment(postId: number, userId: number, content: string): Promise<any> {
    try {
      if (!content || content.trim().length === 0) {
        throw new AppError(400, 'Comment content is required');
      }

      if (content.length > 2000) {
        throw new AppError(400, 'Comment must be less than 2000 characters');
      }

      // Check if post exists
      const post = await this.db('posts').where('id', postId).first();
      if (!post) {
        throw new AppError(404, 'Post not found');
      }

      // Create comment
      const [commentId] = await this.db('post_comments').insert({
        post_id: postId,
        user_id: userId,
        content: content.trim(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Update engagement score
      await this.db('posts')
        .where('id', postId)
        .increment('engagement_score', 2);

      // Return comment with user info
      const comment = await this.db('post_comments')
        .join('users', 'post_comments.user_id', 'users.id')
        .where('post_comments.id', commentId)
        .select('post_comments.*', 'users.username', 'users.display_name', 'users.avatar_url')
        .first();

      return comment;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to add comment', { error: String(error) });
    }
  }

  async getComments(postId: number, limit = 20, offset = 0): Promise<any[]> {
    try {
      const comments = await this.db('post_comments')
        .join('users', 'post_comments.user_id', 'users.id')
        .where('post_comments.post_id', postId)
        .select('post_comments.*', 'users.username', 'users.display_name', 'users.avatar_url')
        .orderBy('post_comments.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return comments;
    } catch (error) {
      throw new AppError(500, 'Failed to fetch comments', { error: String(error) });
    }
  }
}

export const postService = new PostService();
