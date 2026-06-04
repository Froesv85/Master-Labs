import crypto from 'crypto';

import { getDatabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface CreateTeamPayload {
  name: string;
  description?: string;
  logo_url?: string;
  visibility?: 'public' | 'private';
  max_members?: number;
}

interface UpdateTeamPayload {
  name?: string;
  description?: string;
  logo_url?: string;
  visibility?: 'public' | 'private';
  max_members?: number;
}

interface AddMemberPayload {
  user_id: number;
  role?: 'admin' | 'contributor' | 'viewer';
}

interface InviteMemberPayload {
  email: string;
  role?: 'contributor' | 'viewer';
  expires_in_days?: number;
}

export class TeamService {
  private db = getDatabase();

  async createTeam(userId: number, payload: CreateTeamPayload) {
    try {
      if (!payload.name || payload.name.trim().length < 3) {
        throw new AppError(400, 'Team name must have at least 3 characters');
      }

      const [teamId] = await this.db('teams').insert({
        name: payload.name.trim(),
        description: payload.description,
        owner_id: userId,
        logo_url: payload.logo_url,
        visibility: payload.visibility || 'public',
        max_members: payload.max_members || 10,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await this.db('team_members').insert({
        team_id: teamId,
        user_id: userId,
        role: 'owner',
        joined_at: new Date(),
      });

      logger.info('Team created', { teamId, userId });
      return this.getTeamById(teamId, userId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to create team', { error: String(error) });
    }
  }

  async getTeamById(teamId: number, currentUserId?: number) {
    try {
      const team = await this.db('teams')
        .join('users', 'teams.owner_id', 'users.id')
        .where('teams.id', teamId)
        .select(
          'teams.*',
          'users.username as owner_username',
          'users.display_name as owner_display_name',
          'users.avatar_url as owner_avatar_url'
        )
        .first();

      if (!team) {
        throw new AppError(404, 'Team not found');
      }

      const memberCountRow = await this.db('team_members')
        .where('team_id', teamId)
        .count('* as count')
        .first();

      const projectsCountRow = await this.db('team_projects')
        .where('team_id', teamId)
        .count('* as count')
        .first();

      let myRole: string | null = null;
      if (currentUserId) {
        const membership = await this.db('team_members')
          .where({ team_id: teamId, user_id: currentUserId })
          .first();
        myRole = membership?.role || null;
      }

      if (team.visibility === 'private' && !myRole && team.owner_id !== currentUserId) {
        throw new AppError(403, 'Team is private');
      }

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        logo_url: team.logo_url,
        owner_id: team.owner_id,
        owner: {
          id: team.owner_id,
          username: team.owner_username,
          display_name: team.owner_display_name,
          avatar_url: team.owner_avatar_url,
        },
        visibility: team.visibility,
        max_members: team.max_members,
        member_count: Number(memberCountRow?.count || 0),
        projects_count: Number(projectsCountRow?.count || 0),
        my_role: myRole,
        created_at: team.created_at,
        updated_at: team.updated_at,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to fetch team', { error: String(error) });
    }
  }

  async listTeams(filters: {
    visibility?: 'public' | 'private';
    search?: string;
    limit?: number;
    offset?: number;
  }, currentUserId?: number) {
    try {
      const limit = filters.limit || 20;
      const offset = filters.offset || 0;

      const query = this.db('teams')
        .leftJoin('team_members as tm', 'teams.id', 'tm.team_id')
        .leftJoin('users', 'teams.owner_id', 'users.id')
        .select(
          'teams.*',
          'users.username as owner_username',
          'users.display_name as owner_display_name'
        )
        .groupBy('teams.id', 'users.id');

      if (filters.visibility) {
        query.where('teams.visibility', filters.visibility);
      }

      if (filters.search) {
        query.where((builder) => {
          builder
            .where('teams.name', 'like', `%${filters.search}%`)
            .orWhere('teams.description', 'like', `%${filters.search}%`);
        });
      }

      if (currentUserId) {
        query.where((builder) => {
          builder
            .where('teams.visibility', 'public')
            .orWhere('teams.owner_id', currentUserId)
            .orWhereExists(
              this.db('team_members')
                .whereRaw('team_members.team_id = teams.id')
                .where('team_members.user_id', currentUserId)
            );
        });
      } else {
        query.where('teams.visibility', 'public');
      }

      const totalRow = await query.clone().clearSelect().countDistinct('teams.id as count').first();

      const teams = await query
        .orderBy('teams.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return {
        teams,
        total: Number(totalRow?.count || 0),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to list teams', { error: String(error) });
    }
  }

  async updateTeam(teamId: number, userId: number, payload: UpdateTeamPayload) {
    try {
      await this.assertTeamAdmin(teamId, userId);

      await this.db('teams')
        .where('id', teamId)
        .update({
          ...payload,
          updated_at: new Date(),
        });

      logger.info('Team updated', { teamId, userId });
      return this.getTeamById(teamId, userId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to update team', { error: String(error) });
    }
  }

  async deleteTeam(teamId: number, userId: number): Promise<void> {
    try {
      const team = await this.db('teams').where('id', teamId).first();

      if (!team) {
        throw new AppError(404, 'Team not found');
      }

      if (team.owner_id !== userId) {
        throw new AppError(403, 'Only the team owner can delete this team');
      }

      await this.db('teams').where('id', teamId).delete();
      logger.info('Team deleted', { teamId, userId });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to delete team', { error: String(error) });
    }
  }

  async listMembers(teamId: number) {
    try {
      await this.assertTeamExists(teamId);

      return this.db('team_members')
        .join('users', 'team_members.user_id', 'users.id')
        .where('team_members.team_id', teamId)
        .select(
          'team_members.user_id',
          'team_members.role',
          'team_members.joined_at',
          'users.username',
          'users.display_name',
          'users.avatar_url'
        )
        .orderBy('team_members.joined_at', 'asc');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to list team members', { error: String(error) });
    }
  }

  async addMember(teamId: number, userId: number, payload: AddMemberPayload) {
    try {
      await this.assertTeamAdmin(teamId, userId);

      if (!payload.user_id) {
        throw new AppError(400, 'user_id is required');
      }

      const team = await this.db('teams').where('id', teamId).first();
      if (!team) {
        throw new AppError(404, 'Team not found');
      }

      const user = await this.db('users').where('id', payload.user_id).first();
      if (!user) {
        throw new AppError(404, 'User not found');
      }

      const existing = await this.db('team_members')
        .where({ team_id: teamId, user_id: payload.user_id })
        .first();
      if (existing) {
        throw new AppError(409, 'User is already a team member');
      }

      const membersCountRow = await this.db('team_members')
        .where('team_id', teamId)
        .count('* as count')
        .first();
      const membersCount = Number(membersCountRow?.count || 0);

      if (membersCount >= team.max_members) {
        throw new AppError(400, 'Team has reached maximum member capacity');
      }

      await this.db('team_members').insert({
        team_id: teamId,
        user_id: payload.user_id,
        role: payload.role || 'contributor',
        joined_at: new Date(),
      });

      logger.info('Team member added', {
        teamId,
        userId,
        newMemberId: payload.user_id,
      });

      return this.listMembers(teamId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to add team member', { error: String(error) });
    }
  }

  async removeMember(teamId: number, userId: number, memberId: number) {
    try {
      const team = await this.db('teams').where('id', teamId).first();

      if (!team) {
        throw new AppError(404, 'Team not found');
      }

      const requesterMembership = await this.db('team_members')
        .where({ team_id: teamId, user_id: userId })
        .first();

      const canManage = userId === team.owner_id || requesterMembership?.role === 'admin';
      if (!canManage && userId !== memberId) {
        throw new AppError(403, 'You do not have permission to remove this member');
      }

      if (memberId === team.owner_id) {
        throw new AppError(400, 'Team owner cannot be removed');
      }

      const removedRows = await this.db('team_members')
        .where({ team_id: teamId, user_id: memberId })
        .delete();

      if (!removedRows) {
        throw new AppError(404, 'Member not found in team');
      }

      logger.info('Team member removed', { teamId, userId, memberId });
      return this.listMembers(teamId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to remove team member', { error: String(error) });
    }
  }

  async addProject(teamId: number, userId: number, projectId: number) {
    try {
      await this.assertTeamAdmin(teamId, userId);

      const project = await this.db('projects').where('id', projectId).first();
      if (!project) {
        throw new AppError(404, 'Project not found');
      }

      const existing = await this.db('team_projects')
        .where({ team_id: teamId, project_id: projectId })
        .first();
      if (existing) {
        throw new AppError(409, 'Project already linked to team');
      }

      await this.db('team_projects').insert({
        team_id: teamId,
        project_id: projectId,
        added_at: new Date(),
      });

      logger.info('Project linked to team', { teamId, userId, projectId });
      return this.getTeamProjects(teamId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to link project to team', { error: String(error) });
    }
  }

  async removeProject(teamId: number, userId: number, projectId: number) {
    try {
      await this.assertTeamAdmin(teamId, userId);

      const deletedRows = await this.db('team_projects')
        .where({ team_id: teamId, project_id: projectId })
        .delete();

      if (!deletedRows) {
        throw new AppError(404, 'Project link not found');
      }

      logger.info('Project unlinked from team', { teamId, userId, projectId });
      return this.getTeamProjects(teamId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to unlink project from team', { error: String(error) });
    }
  }

  async getTeamProjects(teamId: number) {
    try {
      await this.assertTeamExists(teamId);

      return this.db('team_projects')
        .join('projects', 'team_projects.project_id', 'projects.id')
        .where('team_projects.team_id', teamId)
        .select(
          'projects.id',
          'projects.user_id',
          'projects.title',
          'projects.description',
          'projects.category',
          'projects.status',
          'projects.likes_count',
          'projects.views_count',
          'projects.created_at',
          'projects.updated_at',
          'team_projects.added_at'
        )
        .orderBy('team_projects.added_at', 'desc');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to list team projects', { error: String(error) });
    }
  }

  async inviteMember(teamId: number, userId: number, payload: InviteMemberPayload) {
    try {
      await this.assertTeamAdmin(teamId, userId);

      if (!payload.email || !payload.email.includes('@')) {
        throw new AppError(400, 'A valid email is required');
      }

      const role = payload.role || 'contributor';
      const expiresInDays = payload.expires_in_days || 7;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const token = crypto.randomBytes(24).toString('hex');

      const [inviteId] = await this.db('team_invites').insert({
        team_id: teamId,
        email: payload.email.toLowerCase(),
        role,
        token,
        expires_at: expiresAt,
        created_at: new Date(),
      });

      logger.info('Team invite created', { teamId, userId, inviteId, email: payload.email });

      return {
        id: inviteId,
        team_id: teamId,
        email: payload.email.toLowerCase(),
        role,
        token,
        expires_at: expiresAt,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to invite member', { error: String(error) });
    }
  }

  async listInvites(teamId: number, userId: number) {
    try {
      await this.assertTeamAdmin(teamId, userId);

      return this.db('team_invites')
        .where('team_id', teamId)
        .where('expires_at', '>', new Date())
        .select('id', 'email', 'role', 'token', 'expires_at', 'created_at')
        .orderBy('created_at', 'desc');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to list team invites', { error: String(error) });
    }
  }

  private async assertTeamExists(teamId: number): Promise<void> {
    const team = await this.db('teams').where('id', teamId).first();
    if (!team) {
      throw new AppError(404, 'Team not found');
    }
  }

  private async assertTeamAdmin(teamId: number, userId: number): Promise<void> {
    const team = await this.db('teams').where('id', teamId).first();

    if (!team) {
      throw new AppError(404, 'Team not found');
    }

    if (team.owner_id === userId) {
      return;
    }

    const membership = await this.db('team_members')
      .where({ team_id: teamId, user_id: userId })
      .first();

    if (!membership || membership.role !== 'admin') {
      throw new AppError(403, 'You do not have permission for this operation');
    }
  }
}

export const teamService = new TeamService();
