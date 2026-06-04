import { getDatabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface CreateProjectPayload {
  title: string;
  description: string;
  category: string; // 3D Printing, Robotics, IoT, Woodworking
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimated_hours?: number;
  budget?: number;
  status?: 'planning' | 'in_progress' | 'completed' | 'archived';
  is_public?: boolean;
}

interface UpdateProjectPayload {
  title?: string;
  description?: string;
  category?: string;
  difficulty_level?: string;
  estimated_hours?: number;
  budget?: number;
  status?: string;
  is_public?: boolean;
}

interface ProjectResponse {
  id: number;
  user_id: number;
  parent_project_id?: number;
  user: {
    id: number;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  estimated_hours?: number;
  budget?: number;
  status: string;
  is_public: boolean;
  likes_count: number;
  downloads_count: number;
  views_count: number;
  components_count: number;
  collaborators_count: number;
  pdf_export_status?: string;
  repository_url?: string;
  documentation_url?: string;
  liked_by_me?: boolean;
  created_at: Date;
  updated_at: Date;
}

interface ComponentPayload {
  name: string;
  part_number?: string;
  quantity: number;
  unit_cost?: number;
  supplier?: string;
  datasheet_url?: string;
  notes?: string;
}

interface BOMItemPayload {
  component_id: number;
  quantity: number;
  notes?: string;
}

interface ErrorLogPayload {
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  resolution?: string;
}

export class ProjectService {
  private db = getDatabase();

  async createProject(userId: number, payload: CreateProjectPayload): Promise<ProjectResponse> {
    try {
      // Validations
      if (!payload.title || !payload.description || !payload.category) {
        throw new AppError(400, 'Title, description, and category are required');
      }

      if (payload.title.length > 255) {
        throw new AppError(400, 'Title must be less than 255 characters');
      }

      const validCategories = ['3D Printing', 'Robotics', 'IoT', 'Woodworking'];
      if (!validCategories.includes(payload.category)) {
        throw new AppError(400, `Invalid category. Must be one of: ${validCategories.join(', ')}`);
      }

      // Create project
      const [projectId] = await this.db('projects').insert({
        user_id: userId,
        title: payload.title,
        description: payload.description,
        category: payload.category,
        difficulty_level: payload.difficulty_level || 'intermediate',
        estimated_hours: payload.estimated_hours,
        budget: payload.budget,
        status: payload.status || 'planning',
        is_public: payload.is_public !== false,
        likes_count: 0,
        downloads_count: 0,
        views_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      });

      logger.info('Project created', { projectId, userId, category: payload.category });
      return this.getProjectById(projectId, userId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to create project', { error, userId, payload });
      throw new AppError(500, 'Failed to create project', { error: String(error) });
    }
  }

  async getProjectById(projectId: number, currentUserId?: number): Promise<ProjectResponse> {
    try {
      const project = await this.db('projects')
        .join('users', 'projects.user_id', 'users.id')
        .where('projects.id', projectId)
        .select(
          'projects.*',
          'users.username',
          'users.display_name',
          'users.avatar_url'
        )
        .first();

      if (!project) {
        throw new AppError(404, 'Project not found');
      }

      // Check authorization for private projects
      if (!project.is_public && currentUserId !== project.user_id) {
        throw new AppError(403, 'Project is private');
      }

      // Increment view count
      await this.db('projects')
        .where('id', projectId)
        .increment('views_count', 1);

      // Get collaborators count
      const collaborators = await this.db('project_collaborators')
        .where('project_id', projectId)
        .count('* as count')
        .first();

      // Check if current user liked it
      let likedByMe = false;
      if (currentUserId) {
        const vote = await this.db('project_votes')
          .where('project_id', projectId)
          .where('user_id', currentUserId)
          .first();
        likedByMe = vote && vote.vote_type === 'upvote';
      }

      return {
        id: project.id,
        user_id: project.user_id,
        parent_project_id: project.parent_project_id,
        user: {
          id: project.user_id,
          username: project.username,
          display_name: project.display_name,
          avatar_url: project.avatar_url,
        },
        title: project.title,
        description: project.description,
        category: project.category,
        difficulty_level: project.difficulty_level,
        estimated_hours: project.estimated_hours,
        budget: project.budget,
        status: project.status,
        is_public: project.is_public,
        likes_count: project.likes_count,
        downloads_count: project.downloads_count,
        views_count: project.views_count,
        components_count: (await this.db('project_components').where('project_id', projectId).count('* as count').first())?.count || 0,
        collaborators_count: collaborators?.count || 0,
        pdf_export_status: project.pdf_export_status,
        repository_url: project.repository_url,
        documentation_url: project.documentation_url,
        liked_by_me: likedByMe,
        created_at: project.created_at,
        updated_at: project.updated_at,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to fetch project', { error: String(error) });
    }
  }

  async updateProject(projectId: number, userId: number, payload: UpdateProjectPayload): Promise<ProjectResponse> {
    try {
      // Check ownership
      const project = await this.db('projects').where('id', projectId).first();

      if (!project) {
        throw new AppError(404, 'Project not found');
      }

      if (project.user_id !== userId) {
        throw new AppError(403, 'You can only update your own projects');
      }

      // Update
      await this.db('projects').where('id', projectId).update({
        ...payload,
        updated_at: new Date(),
      });

      logger.info('Project updated', { projectId, userId });
      return this.getProjectById(projectId, userId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to update project', { error: String(error) });
    }
  }

  async deleteProject(projectId: number, userId: number): Promise<void> {
    try {
      const project = await this.db('projects').where('id', projectId).first();

      if (!project) {
        throw new AppError(404, 'Project not found');
      }

      if (project.user_id !== userId) {
        throw new AppError(403, 'You can only delete your own projects');
      }

      await this.db('projects').where('id', projectId).delete();
      logger.info('Project deleted', { projectId, userId });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to delete project', { error: String(error) });
    }
  }

  async forkProject(sourceProjectId: number, userId: number, title?: string): Promise<ProjectResponse> {
    try {
      const sourceProject = await this.db('projects').where('id', sourceProjectId).first();

      if (!sourceProject) {
        throw new AppError(404, 'Source project not found');
      }

      // Create forked project
      const [newProjectId] = await this.db('projects').insert({
        user_id: userId,
        parent_project_id: sourceProjectId,
        title: title || `${sourceProject.title} (Fork)`,
        description: sourceProject.description,
        category: sourceProject.category,
        difficulty_level: sourceProject.difficulty_level,
        estimated_hours: sourceProject.estimated_hours,
        budget: sourceProject.budget,
        status: 'planning',
        is_public: true,
        likes_count: 0,
        downloads_count: 0,
        views_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Copy components if any exist
      const components = await this.db('project_components')
        .where('project_id', sourceProjectId);

      if (components.length > 0) {
        const newComponents = components.map((comp: any) => ({
          project_id: newProjectId,
          name: comp.name,
          part_number: comp.part_number,
          quantity: comp.quantity,
          unit_cost: comp.unit_cost,
          supplier: comp.supplier,
          datasheet_url: comp.datasheet_url,
          notes: comp.notes,
          created_at: new Date(),
          updated_at: new Date(),
        }));

        await this.db('project_components').insert(newComponents);
      }

      logger.info('Project forked', { sourceProjectId, newProjectId, userId });
      return this.getProjectById(newProjectId, userId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to fork project', { error: String(error) });
    }
  }

  async listProjects(filters: {
    category?: string;
    difficulty?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sort?: 'newest' | 'trending' | 'popular';
  }, currentUserId?: number): Promise<{ projects: ProjectResponse[]; total: number }> {
    try {
      const limit = Math.min(filters.limit || 20, 100);
      const offset = filters.offset || 0;

      let query = this.db('projects')
        .where('is_public', true)
        .where('status', '!=', 'archived');

      if (filters.category) {
        query = query.where('category', filters.category);
      }

      if (filters.difficulty) {
        query = query.where('difficulty_level', filters.difficulty);
      }

      if (filters.status) {
        query = query.where('status', filters.status);
      }

      if (filters.search) {
        query = query.where((q) => {
          q.where('title', 'like', `%${filters.search}%`)
            .orWhere('description', 'like', `%${filters.search}%`);
        });
      }

      // Count total
      const countResult = await query.clone().count('* as count').first();
      const total = countResult?.count || 0;

      // Apply sorting
      switch (filters.sort) {
        case 'trending':
          query = query.orderBy('likes_count', 'desc');
          break;
        case 'popular':
          query = query.orderBy('downloads_count', 'desc');
          break;
        case 'newest':
        default:
          query = query.orderBy('created_at', 'desc');
      }

      const projects = await query.limit(limit).offset(offset);

      const detailedProjects: ProjectResponse[] = [];
      for (const project of projects) {
        detailedProjects.push(await this.getProjectById(project.id, currentUserId));
      }

      return { projects: detailedProjects, total };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to list projects', { error: String(error) });
    }
  }

  async addComponent(projectId: number, userId: number, payload: ComponentPayload): Promise<any> {
    try {
      // Check ownership
      const project = await this.db('projects').where('id', projectId).first();

      if (!project) {
        throw new AppError(404, 'Project not found');
      }

      if (project.user_id !== userId) {
        throw new AppError(403, 'You can only add components to your own projects');
      }

      const [componentId] = await this.db('project_components').insert({
        project_id: projectId,
        name: payload.name,
        part_number: payload.part_number,
        quantity: payload.quantity,
        unit_cost: payload.unit_cost,
        supplier: payload.supplier,
        datasheet_url: payload.datasheet_url,
        notes: payload.notes,
        created_at: new Date(),
        updated_at: new Date(),
      });

      return this.db('project_components').where('id', componentId).first();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to add component', { error: String(error) });
    }
  }

  async getComponents(projectId: number): Promise<any[]> {
    try {
      return await this.db('project_components')
        .where('project_id', projectId)
        .orderBy('created_at', 'desc');
    } catch (error) {
      throw new AppError(500, 'Failed to fetch components', { error: String(error) });
    }
  }

  async addErrorLog(projectId: number, userId: number, payload: ErrorLogPayload): Promise<any> {
    try {
      // Check ownership
      const project = await this.db('projects').where('id', projectId).first();

      if (!project) {
        throw new AppError(404, 'Project not found');
      }

      if (project.user_id !== userId) {
        throw new AppError(403, 'You can only log errors to your own projects');
      }

      const [logId] = await this.db('project_error_logs').insert({
        project_id: projectId,
        user_id: userId,
        title: payload.title,
        description: payload.description,
        severity: payload.severity,
        resolution: payload.resolution,
        created_at: new Date(),
        updated_at: new Date(),
      });

      return this.db('project_error_logs').where('id', logId).first();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to add error log', { error: String(error) });
    }
  }

  async getErrorLogs(projectId: number, limit = 20, offset = 0): Promise<any[]> {
    try {
      return await this.db('project_error_logs')
        .where('project_id', projectId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);
    } catch (error) {
      throw new AppError(500, 'Failed to fetch error logs', { error: String(error) });
    }
  }

  async upvoteProject(projectId: number, userId: number): Promise<void> {
    try {
      const project = await this.db('projects').where('id', projectId).first();

      if (!project) {
        throw new AppError(404, 'Project not found');
      }

      // Check if already voted
      const existingVote = await this.db('project_votes')
        .where('project_id', projectId)
        .where('user_id', userId)
        .first();

      if (existingVote && existingVote.vote_type === 'upvote') {
        throw new AppError(409, 'Already upvoted this project');
      }

      if (existingVote) {
        // Remove downvote, add upvote
        await this.db('project_votes')
          .where('id', existingVote.id)
          .update({ vote_type: 'upvote', updated_at: new Date() });

        // Update counts
        if (existingVote.vote_type === 'downvote') {
          await this.db('projects').where('id', projectId).increment('likes_count', 2);
        }
      } else {
        // New upvote
        await this.db('project_votes').insert({
          project_id: projectId,
          user_id: userId,
          vote_type: 'upvote',
          created_at: new Date(),
          updated_at: new Date(),
        });

        await this.db('projects').where('id', projectId).increment('likes_count', 1);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to upvote project', { error: String(error) });
    }
  }

  async downvoteProject(projectId: number, userId: number): Promise<void> {
    try {
      const project = await this.db('projects').where('id', projectId).first();

      if (!project) {
        throw new AppError(404, 'Project not found');
      }

      // Check if already downvoted
      const existingVote = await this.db('project_votes')
        .where('project_id', projectId)
        .where('user_id', userId)
        .first();

      if (existingVote && existingVote.vote_type === 'downvote') {
        throw new AppError(409, 'Already downvoted this project');
      }

      if (existingVote) {
        // Remove upvote, add downvote
        await this.db('project_votes')
          .where('id', existingVote.id)
          .update({ vote_type: 'downvote', updated_at: new Date() });

        // Update counts
        if (existingVote.vote_type === 'upvote') {
          await this.db('projects').where('id', projectId).decrement('likes_count', 2);
        }
      } else {
        // New downvote
        await this.db('project_votes').insert({
          project_id: projectId,
          user_id: userId,
          vote_type: 'downvote',
          created_at: new Date(),
          updated_at: new Date(),
        });

        await this.db('projects').where('id', projectId).decrement('likes_count', 1);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to downvote project', { error: String(error) });
    }
  }

  async addCollaborator(projectId: number, userId: number, collaboratorId: number, role = 'contributor'): Promise<void> {
    try {
      // Check ownership
      const project = await this.db('projects').where('id', projectId).first();

      if (!project) {
        throw new AppError(404, 'Project not found');
      }

      if (project.user_id !== userId) {
        throw new AppError(403, 'Only project owner can add collaborators');
      }

      // Check if already collaborator
      const existing = await this.db('project_collaborators')
        .where('project_id', projectId)
        .where('user_id', collaboratorId)
        .first();

      if (existing) {
        throw new AppError(409, 'User is already a collaborator');
      }

      await this.db('project_collaborators').insert({
        project_id: projectId,
        user_id: collaboratorId,
        role,
        joined_at: new Date(),
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to add collaborator', { error: String(error) });
    }
  }

  async removeCollaborator(projectId: number, userId: number, collaboratorId: number): Promise<void> {
    try {
      const project = await this.db('projects').where('id', projectId).first();

      if (!project) {
        throw new AppError(404, 'Project not found');
      }

      if (project.user_id !== userId) {
        throw new AppError(403, 'Only project owner can remove collaborators');
      }

      await this.db('project_collaborators')
        .where('project_id', projectId)
        .where('user_id', collaboratorId)
        .delete();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to remove collaborator', { error: String(error) });
    }
  }
}

export const projectService = new ProjectService();
