import { getDatabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface CreateCommunityPayload {
  name: string;
  description?: string;
  category: 'robotics' | '3d-printing' | 'iot' | 'woodworking';
  icon_url?: string;
  visibility?: 'public' | 'private';
}

interface UpdateCommunityPayload {
  name?: string;
  description?: string;
  category?: 'robotics' | '3d-printing' | 'iot' | 'woodworking';
  icon_url?: string;
  visibility?: 'public' | 'private';
}

interface CreateDiscussionPayload {
  title: string;
  content: string;
  tags?: string[];
  pinned?: boolean;
}

interface CreateKnowledgeItemPayload {
  title?: string;
  content: string;
  source_type: 'post' | 'project' | 'discussion' | 'documentation';
  source_id?: number;
  metadata?: Record<string, unknown>;
}

export class CommunityService {
  private db = getDatabase();

  async createCommunity(userId: number, payload: CreateCommunityPayload) {
    try {
      if (!payload.name || payload.name.trim().length < 3) {
        throw new AppError(400, 'Community name must have at least 3 characters');
      }

      if (!payload.category) {
        throw new AppError(400, 'category is required');
      }

      const [communityId] = await this.db('communities').insert({
        name: payload.name.trim(),
        description: payload.description,
        category: payload.category,
        owner_id: userId,
        icon_url: payload.icon_url,
        member_count: 1,
        visibility: payload.visibility || 'public',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await this.db('community_members').insert({
        community_id: communityId,
        user_id: userId,
        role: 'owner',
        joined_at: new Date(),
      });

      logger.info('Community created', { communityId, userId, category: payload.category });
      return this.getCommunityById(communityId, userId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to create community', { error: String(error) });
    }
  }

  async getCommunityById(communityId: number, currentUserId?: number) {
    try {
      const community = await this.db('communities')
        .join('users', 'communities.owner_id', 'users.id')
        .where('communities.id', communityId)
        .select(
          'communities.*',
          'users.username as owner_username',
          'users.display_name as owner_display_name',
          'users.avatar_url as owner_avatar_url'
        )
        .first();

      if (!community) {
        throw new AppError(404, 'Community not found');
      }

      const membership = currentUserId
        ? await this.db('community_members')
          .where({ community_id: communityId, user_id: currentUserId })
          .first()
        : null;

      if (community.visibility === 'private' && !membership && community.owner_id !== currentUserId) {
        throw new AppError(403, 'Community is private');
      }

      const discussionsCountRow = await this.db('discussions')
        .where('community_id', communityId)
        .count('* as count')
        .first();

      const knowledgeItemsCountRow = await this.db('knowledge_items')
        .where('metadata', 'like', `%\"community_id\":${communityId}%`)
        .count('* as count')
        .first();

      return {
        id: community.id,
        name: community.name,
        description: community.description,
        category: community.category,
        icon_url: community.icon_url,
        owner_id: community.owner_id,
        owner: {
          id: community.owner_id,
          username: community.owner_username,
          display_name: community.owner_display_name,
          avatar_url: community.owner_avatar_url,
        },
        member_count: community.member_count,
        visibility: community.visibility,
        my_role: membership?.role || null,
        discussions_count: Number(discussionsCountRow?.count || 0),
        knowledge_items_count: Number(knowledgeItemsCountRow?.count || 0),
        created_at: community.created_at,
        updated_at: community.updated_at,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to fetch community', { error: String(error) });
    }
  }

  async listCommunities(filters: {
    category?: 'robotics' | '3d-printing' | 'iot' | 'woodworking';
    visibility?: 'public' | 'private';
    search?: string;
    limit?: number;
    offset?: number;
  }, currentUserId?: number) {
    try {
      const limit = filters.limit || 20;
      const offset = filters.offset || 0;

      const query = this.db('communities')
        .join('users', 'communities.owner_id', 'users.id')
        .select(
          'communities.*',
          'users.username as owner_username',
          'users.display_name as owner_display_name'
        );

      if (filters.category) {
        query.where('communities.category', filters.category);
      }

      if (filters.visibility) {
        query.where('communities.visibility', filters.visibility);
      }

      if (filters.search) {
        query.where((builder) => {
          builder
            .where('communities.name', 'like', `%${filters.search}%`)
            .orWhere('communities.description', 'like', `%${filters.search}%`);
        });
      }

      if (currentUserId) {
        query.where((builder) => {
          builder
            .where('communities.visibility', 'public')
            .orWhere('communities.owner_id', currentUserId)
            .orWhereExists(
              this.db('community_members')
                .whereRaw('community_members.community_id = communities.id')
                .where('community_members.user_id', currentUserId)
            );
        });
      } else {
        query.where('communities.visibility', 'public');
      }

      const totalRow = await query.clone().clearSelect().countDistinct('communities.id as count').first();

      const communities = await query
        .orderBy('communities.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return {
        communities,
        total: Number(totalRow?.count || 0),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to list communities', { error: String(error) });
    }
  }

  async updateCommunity(communityId: number, userId: number, payload: UpdateCommunityPayload) {
    try {
      await this.assertCommunityAdmin(communityId, userId);

      await this.db('communities')
        .where('id', communityId)
        .update({
          ...payload,
          updated_at: new Date(),
        });

      logger.info('Community updated', { communityId, userId });
      return this.getCommunityById(communityId, userId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to update community', { error: String(error) });
    }
  }

  async deleteCommunity(communityId: number, userId: number): Promise<void> {
    try {
      const community = await this.db('communities').where('id', communityId).first();

      if (!community) {
        throw new AppError(404, 'Community not found');
      }

      if (community.owner_id !== userId) {
        throw new AppError(403, 'Only the owner can delete this community');
      }

      await this.db('communities').where('id', communityId).delete();
      logger.info('Community deleted', { communityId, userId });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to delete community', { error: String(error) });
    }
  }

  async joinCommunity(communityId: number, userId: number) {
    try {
      await this.assertCommunityExists(communityId);

      const existing = await this.db('community_members')
        .where({ community_id: communityId, user_id: userId })
        .first();

      if (existing) {
        throw new AppError(409, 'User is already a community member');
      }

      await this.db('community_members').insert({
        community_id: communityId,
        user_id: userId,
        role: 'member',
        joined_at: new Date(),
      });

      await this.db('communities')
        .where('id', communityId)
        .increment('member_count', 1)
        .update({ updated_at: new Date() });

      logger.info('Community joined', { communityId, userId });
      return this.getCommunityById(communityId, userId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to join community', { error: String(error) });
    }
  }

  async leaveCommunity(communityId: number, userId: number) {
    try {
      const community = await this.db('communities').where('id', communityId).first();
      if (!community) {
        throw new AppError(404, 'Community not found');
      }

      if (community.owner_id === userId) {
        throw new AppError(400, 'Owner cannot leave community. Transfer ownership first.');
      }

      const deletedRows = await this.db('community_members')
        .where({ community_id: communityId, user_id: userId })
        .delete();

      if (!deletedRows) {
        throw new AppError(404, 'Membership not found');
      }

      await this.db('communities')
        .where('id', communityId)
        .decrement('member_count', 1)
        .update({ updated_at: new Date() });

      logger.info('Community left', { communityId, userId });
      return this.getCommunityById(communityId, userId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to leave community', { error: String(error) });
    }
  }

  async listMembers(communityId: number, limit = 50, offset = 0) {
    try {
      await this.assertCommunityExists(communityId);

      return this.db('community_members')
        .join('users', 'community_members.user_id', 'users.id')
        .where('community_members.community_id', communityId)
        .select(
          'community_members.user_id',
          'community_members.role',
          'community_members.joined_at',
          'users.username',
          'users.display_name',
          'users.avatar_url'
        )
        .orderBy('community_members.joined_at', 'asc')
        .limit(limit)
        .offset(offset);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to list community members', { error: String(error) });
    }
  }

  async startDiscussion(communityId: number, userId: number, payload: CreateDiscussionPayload) {
    try {
      await this.assertCommunityMember(communityId, userId);

      if (!payload.title || !payload.content) {
        throw new AppError(400, 'title and content are required');
      }

      const [discussionId] = await this.db('discussions').insert({
        community_id: communityId,
        user_id: userId,
        title: payload.title,
        content: payload.content,
        tags: payload.tags ? JSON.stringify(payload.tags) : null,
        pinned: payload.pinned === true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      logger.info('Discussion created', { communityId, discussionId, userId });
      return this.getDiscussionById(communityId, discussionId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to start discussion', { error: String(error) });
    }
  }

  async getDiscussionById(communityId: number, discussionId: number) {
    try {
      const discussion = await this.db('discussions')
        .join('users', 'discussions.user_id', 'users.id')
        .where('discussions.id', discussionId)
        .andWhere('discussions.community_id', communityId)
        .select(
          'discussions.*',
          'users.username',
          'users.display_name',
          'users.avatar_url'
        )
        .first();

      if (!discussion) {
        throw new AppError(404, 'Discussion not found');
      }

      return discussion;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to fetch discussion', { error: String(error) });
    }
  }

  async listDiscussions(communityId: number, limit = 20, offset = 0) {
    try {
      await this.assertCommunityExists(communityId);

      return this.db('discussions')
        .join('users', 'discussions.user_id', 'users.id')
        .where('discussions.community_id', communityId)
        .select(
          'discussions.*',
          'users.username',
          'users.display_name',
          'users.avatar_url'
        )
        .orderBy('discussions.pinned', 'desc')
        .orderBy('discussions.created_at', 'desc')
        .limit(limit)
        .offset(offset);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to list discussions', { error: String(error) });
    }
  }

  async addKnowledgeItem(communityId: number, userId: number, payload: CreateKnowledgeItemPayload) {
    try {
      await this.assertCommunityMember(communityId, userId);

      if (!payload.content || !payload.source_type) {
        throw new AppError(400, 'content and source_type are required');
      }

      const metadata = {
        ...(payload.metadata || {}),
        community_id: communityId,
        created_by_user_id: userId,
      };

      const [knowledgeItemId] = await this.db('knowledge_items').insert({
        source_type: payload.source_type,
        source_id: payload.source_id,
        title: payload.title,
        content: payload.content,
        metadata: JSON.stringify(metadata),
        created_at: new Date(),
        updated_at: new Date(),
      });

      logger.info('Knowledge item added', { communityId, knowledgeItemId, userId });
      return this.getKnowledgeItemById(knowledgeItemId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to add knowledge item', { error: String(error) });
    }
  }

  async getKnowledgeItemById(knowledgeItemId: number) {
    const item = await this.db('knowledge_items').where('id', knowledgeItemId).first();

    if (!item) {
      throw new AppError(404, 'Knowledge item not found');
    }

    return item;
  }

  async listKnowledgeItems(communityId: number, options: {
    source_type?: 'post' | 'project' | 'discussion' | 'documentation';
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      const limit = options.limit || 20;
      const offset = options.offset || 0;

      const query = this.db('knowledge_items')
        .where('metadata', 'like', `%\"community_id\":${communityId}%`);

      if (options.source_type) {
        query.andWhere('source_type', options.source_type);
      }

      if (options.search) {
        query.andWhere((builder) => {
          builder
            .where('title', 'like', `%${options.search}%`)
            .orWhere('content', 'like', `%${options.search}%`);
        });
      }

      const totalRow = await query.clone().clearSelect().count('* as count').first();

      const items = await query
        .select('*')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return {
        items,
        total: Number(totalRow?.count || 0),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to list knowledge items', { error: String(error) });
    }
  }

  private async assertCommunityExists(communityId: number): Promise<void> {
    const community = await this.db('communities').where('id', communityId).first();
    if (!community) {
      throw new AppError(404, 'Community not found');
    }
  }

  private async assertCommunityMember(communityId: number, userId: number): Promise<void> {
    const community = await this.db('communities').where('id', communityId).first();
    if (!community) {
      throw new AppError(404, 'Community not found');
    }

    if (community.owner_id === userId) {
      return;
    }

    const membership = await this.db('community_members')
      .where({ community_id: communityId, user_id: userId })
      .first();

    if (!membership) {
      throw new AppError(403, 'Only community members can perform this action');
    }
  }

  private async assertCommunityAdmin(communityId: number, userId: number): Promise<void> {
    const community = await this.db('communities').where('id', communityId).first();
    if (!community) {
      throw new AppError(404, 'Community not found');
    }

    if (community.owner_id === userId) {
      return;
    }

    const membership = await this.db('community_members')
      .where({ community_id: communityId, user_id: userId })
      .first();

    if (!membership || membership.role !== 'moderator') {
      throw new AppError(403, 'You do not have permission for this operation');
    }
  }
}

export const communityService = new CommunityService();
