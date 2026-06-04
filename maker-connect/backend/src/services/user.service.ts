import { getDatabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { User, UserProfile } from '../types';

interface UpdateProfilePayload {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  github_url?: string;
  portfolio_url?: string;
  expertise_areas?: string[];
  years_of_experience?: number;
}

interface UserProfileResponse {
  id: number;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  maker_level: string;
  expertise_areas: string[];
  reputation_score: number;
  total_projects: number;
  total_contributions: number;
  github_url?: string;
  portfolio_url?: string;
  years_of_experience?: number;
  follower_count: number;
  following_count: number;
  created_at: Date;
}

export class UserService {
  private db = getDatabase();

  async getProfileById(userId: number): Promise<UserProfileResponse> {
    try {
      const user = await this.db('users').where('id', userId).first();

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      const profile = await this.db('user_profiles')
        .where('user_id', userId)
        .first();

      // Get follower and following counts
      const followerCount = await this.db('user_follows')
        .where('following_id', userId)
        .count('* as count')
        .first();

      const followingCount = await this.db('user_follows')
        .where('follower_id', userId)
        .count('* as count')
        .first();

      return {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        bio: user.bio,
        avatar_url: user.avatar_url,
        maker_level: profile.maker_level || 'apprentice',
        expertise_areas: profile.expertise_areas || [],
        reputation_score: profile.reputation_score || 0,
        total_projects: profile.total_projects || 0,
        total_contributions: profile.total_contributions || 0,
        github_url: profile.github_url,
        portfolio_url: profile.portfolio_url,
        years_of_experience: profile.years_of_experience,
        follower_count: Number(followerCount?.count || 0),
        following_count: Number(followingCount?.count || 0),
        created_at: user.created_at,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to fetch profile', { error: String(error) });
    }
  }

  async updateProfile(userId: number, payload: UpdateProfilePayload): Promise<UserProfileResponse> {
    try {
      // Check if user exists
      const user = await this.db('users').where('id', userId).first();
      if (!user) {
        throw new AppError(404, 'User not found');
      }

      // Update user table
      if (payload.display_name || payload.bio || payload.avatar_url) {
        await this.db('users').where('id', userId).update({
          display_name: payload.display_name || user.display_name,
          bio: payload.bio !== undefined ? payload.bio : user.bio,
          avatar_url: payload.avatar_url !== undefined ? payload.avatar_url : user.avatar_url,
          updated_at: new Date(),
        });
      }

      // Update user_profiles table
      const profileUpdate: any = {};
      if (payload.expertise_areas) profileUpdate.expertise_areas = payload.expertise_areas;
      if (payload.github_url !== undefined) profileUpdate.github_url = payload.github_url;
      if (payload.portfolio_url !== undefined) profileUpdate.portfolio_url = payload.portfolio_url;
      if (payload.years_of_experience !== undefined) profileUpdate.years_of_experience = payload.years_of_experience;

      if (Object.keys(profileUpdate).length > 0) {
        profileUpdate.updated_at = new Date();
        await this.db('user_profiles').where('user_id', userId).update(profileUpdate);
      }

      // Return updated profile
      return this.getProfileById(userId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to update profile', { error: String(error) });
    }
  }

  async followUser(followerId: number, followingId: number): Promise<void> {
    try {
      if (followerId === followingId) {
        throw new AppError(400, 'You cannot follow yourself');
      }

      // Check if user exists
      const user = await this.db('users').where('id', followingId).first();
      if (!user) {
        throw new AppError(404, 'User to follow not found');
      }

      // Check if already following
      const existing = await this.db('user_follows')
        .where('follower_id', followerId)
        .where('following_id', followingId)
        .first();

      if (existing) {
        throw new AppError(409, 'Already following this user');
      }

      // Add follow
      await this.db('user_follows').insert({
        follower_id: followerId,
        following_id: followingId,
        created_at: new Date(),
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to follow user', { error: String(error) });
    }
  }

  async unfollowUser(followerId: number, followingId: number): Promise<void> {
    try {
      await this.db('user_follows')
        .where('follower_id', followerId)
        .where('following_id', followingId)
        .delete();
    } catch (error) {
      throw new AppError(500, 'Failed to unfollow user', { error: String(error) });
    }
  }

  async checkFollowing(followerId: number, followingId: number): Promise<boolean> {
    try {
      const follow = await this.db('user_follows')
        .where('follower_id', followerId)
        .where('following_id', followingId)
        .first();

      return !!follow;
    } catch (error) {
      throw new AppError(500, 'Failed to check follow status', { error: String(error) });
    }
  }

  async getFollowers(userId: number, limit = 20, offset = 0): Promise<any[]> {
    try {
      const followers = await this.db('user_follows')
        .join('users', 'user_follows.follower_id', 'users.id')
        .where('user_follows.following_id', userId)
        .select('users.id', 'users.username', 'users.display_name', 'users.avatar_url', 'user_follows.created_at')
        .limit(limit)
        .offset(offset);

      return followers;
    } catch (error) {
      throw new AppError(500, 'Failed to fetch followers', { error: String(error) });
    }
  }

  async getFollowing(userId: number, limit = 20, offset = 0): Promise<any[]> {
    try {
      const following = await this.db('user_follows')
        .join('users', 'user_follows.following_id', 'users.id')
        .where('user_follows.follower_id', userId)
        .select('users.id', 'users.username', 'users.display_name', 'users.avatar_url', 'user_follows.created_at')
        .limit(limit)
        .offset(offset);

      return following;
    } catch (error) {
      throw new AppError(500, 'Failed to fetch following', { error: String(error) });
    }
  }
}

export const userService = new UserService();
