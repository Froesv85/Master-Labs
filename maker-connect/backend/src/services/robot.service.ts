import { getDatabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface CreateRobotModelPayload {
  name: string;
  description: string;
  hardware_stack?: string[];
  software_stack?: string[];
  dimensions?: string;
  weight?: number;
  max_speed?: number;
  sensors?: string[];
  actuators?: string[];
  power_source?: string;
}

interface CreateRobotInstancePayload {
  model_id: number;
  owner_id: number;
  name: string;
  serial_number?: string;
  firmware_version?: string;
  customizations?: Record<string, any>;
}

interface RobotMatchPayload {
  opponent_instance_id: number;
  match_type: 'competition' | 'friendly' | 'benchmark';
  environment?: string;
  result: 'won' | 'lost' | 'tied';
  score?: number;
  opponent_score?: number;
  duration_seconds?: number;
  notes?: string;
}

interface RobotModelResponse {
  id: number;
  user_id: number;
  name: string;
  description: string;
  hardware_stack?: string[];
  software_stack?: string[];
  dimensions?: string;
  weight?: number;
  max_speed?: number;
  sensors?: string[];
  actuators?: string[];
  power_source?: string;
  instances_count: number;
  avg_win_rate?: number;
  downloads_count: number;
  created_at: Date;
  updated_at: Date;
}

interface RobotInstanceResponse {
  id: number;
  model_id: number;
  model: {
    id: number;
    name: string;
  };
  owner_id: number;
  owner: {
    id: number;
    username: string;
    display_name: string;
  };
  name: string;
  serial_number?: string;
  firmware_version?: string;
  customizations?: Record<string, any>;
  total_matches: number;
  wins: number;
  losses: number;
  ties: number;
  win_rate?: number;
  ranking_position?: number;
  created_at: Date;
  updated_at: Date;
}

interface RobotMatchResponse {
  id: number;
  challenger_instance_id: number;
  opponent_instance_id: number;
  match_type: string;
  environment?: string;
  result: string;
  score?: number;
  opponent_score?: number;
  duration_seconds?: number;
  notes?: string;
  created_at: Date;
}

export class RobotService {
  private db = getDatabase();

  async createRobotModel(userId: number, payload: CreateRobotModelPayload): Promise<RobotModelResponse> {
    try {
      if (!payload.name || !payload.description) {
        throw new AppError(400, 'Name and description are required');
      }

      const [modelId] = await this.db('robot_models').insert({
        user_id: userId,
        name: payload.name,
        description: payload.description,
        hardware_stack: payload.hardware_stack ? JSON.stringify(payload.hardware_stack) : null,
        software_stack: payload.software_stack ? JSON.stringify(payload.software_stack) : null,
        dimensions: payload.dimensions,
        weight: payload.weight,
        max_speed: payload.max_speed,
        sensors: payload.sensors ? JSON.stringify(payload.sensors) : null,
        actuators: payload.actuators ? JSON.stringify(payload.actuators) : null,
        power_source: payload.power_source,
        downloads_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      });

      logger.info('Robot model created', { modelId, userId });
      return this.getRobotModelById(modelId, userId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to create robot model', { error, userId, payload });
      throw new AppError(500, 'Failed to create robot model', { error: String(error) });
    }
  }

  async getRobotModelById(modelId: number, userId?: number): Promise<RobotModelResponse> {
    try {
      const model = await this.db('robot_models')
        .where('id', modelId)
        .first();

      if (!model) {
        throw new AppError(404, 'Robot model not found');
      }

      // Get instances count
      const instancesCount = await this.db('robot_instances')
        .where('model_id', modelId)
        .count('* as count')
        .first();

      // Calculate average win rate
      const matchStats = await this.db('robot_matches')
        .join('robot_instances as challenger', 'robot_matches.challenger_instance_id', 'challenger.id')
        .where('challenger.model_id', modelId)
        .select('robot_matches.result')
        .then((matches: any[]) => {
          const won = matches.filter((m: any) => m.result === 'won').length;
          const total = matches.length;
          return {
            won,
            total,
            avg_win_rate: total > 0 ? (won / total) * 100 : 0,
          };
        });

      return {
        id: model.id,
        user_id: model.user_id,
        name: model.name,
        description: model.description,
        hardware_stack: model.hardware_stack ? JSON.parse(model.hardware_stack) : undefined,
        software_stack: model.software_stack ? JSON.parse(model.software_stack) : undefined,
        dimensions: model.dimensions,
        weight: model.weight,
        max_speed: model.max_speed,
        sensors: model.sensors ? JSON.parse(model.sensors) : undefined,
        actuators: model.actuators ? JSON.parse(model.actuators) : undefined,
        power_source: model.power_source,
        instances_count: instancesCount?.count || 0,
        avg_win_rate: matchStats.avg_win_rate,
        downloads_count: model.downloads_count,
        created_at: model.created_at,
        updated_at: model.updated_at,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to fetch robot model', { error: String(error) });
    }
  }

  async listRobotModels(filters: {
    search?: string;
    limit?: number;
    offset?: number;
    sort?: 'newest' | 'trending' | 'popular';
  }): Promise<{ models: RobotModelResponse[]; total: number }> {
    try {
      const limit = Math.min(filters.limit || 20, 100);
      const offset = filters.offset || 0;

      let query = this.db('robot_models');

      if (filters.search) {
        query = query.where((q) => {
          q.where('name', 'like', `%${filters.search}%`)
            .orWhere('description', 'like', `%${filters.search}%`);
        });
      }

      const countResult = await query.clone().count('* as count').first();
      const total = countResult?.count || 0;

      switch (filters.sort) {
        case 'trending':
          query = query.orderBy('downloads_count', 'desc');
          break;
        case 'popular':
          query = query.orderBy('downloads_count', 'desc');
          break;
        case 'newest':
        default:
          query = query.orderBy('created_at', 'desc');
      }

      const models = await query.limit(limit).offset(offset);

      const detailedModels: RobotModelResponse[] = [];
      for (const model of models) {
        detailedModels.push(await this.getRobotModelById(model.id));
      }

      return { models: detailedModels, total };
    } catch (error) {
      throw new AppError(500, 'Failed to list robot models', { error: String(error) });
    }
  }

  async createRobotInstance(payload: CreateRobotInstancePayload): Promise<RobotInstanceResponse> {
    try {
      // Check model exists
      const model = await this.db('robot_models').where('id', payload.model_id).first();
      if (!model) {
        throw new AppError(404, 'Robot model not found');
      }

      const [instanceId] = await this.db('robot_instances').insert({
        model_id: payload.model_id,
        owner_id: payload.owner_id,
        name: payload.name,
        serial_number: payload.serial_number,
        firmware_version: payload.firmware_version,
        customizations: payload.customizations ? JSON.stringify(payload.customizations) : null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      logger.info('Robot instance created', { instanceId, modelId: payload.model_id });
      return this.getRobotInstanceById(instanceId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to create robot instance', { error: String(error) });
    }
  }

  async getRobotInstanceById(instanceId: number): Promise<RobotInstanceResponse> {
    try {
      const instance = await this.db('robot_instances')
        .join('robot_models', 'robot_instances.model_id', 'robot_models.id')
        .join('users', 'robot_instances.owner_id', 'users.id')
        .where('robot_instances.id', instanceId)
        .select(
          'robot_instances.*',
          'robot_models.id as model_id',
          'robot_models.name as model_name',
          'users.username',
          'users.display_name'
        )
        .first();

      if (!instance) {
        throw new AppError(404, 'Robot instance not found');
      }

      // Get match statistics
      const matches = await this.db('robot_matches')
        .where('challenger_instance_id', instanceId)
        .select('result');

      const wins = matches.filter((m: any) => m.result === 'won').length;
      const losses = matches.filter((m: any) => m.result === 'lost').length;
      const ties = matches.filter((m: any) => m.result === 'tied').length;
      const totalMatches = matches.length;
      const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

      // Get ranking
      const ranking = await this.db('robot_rankings')
        .where('instance_id', instanceId)
        .first();

      return {
        id: instance.id,
        model_id: instance.model_id,
        model: {
          id: instance.model_id,
          name: instance.model_name,
        },
        owner_id: instance.owner_id,
        owner: {
          id: instance.owner_id,
          username: instance.username,
          display_name: instance.display_name,
        },
        name: instance.name,
        serial_number: instance.serial_number,
        firmware_version: instance.firmware_version,
        customizations: instance.customizations ? JSON.parse(instance.customizations) : undefined,
        total_matches: totalMatches,
        wins,
        losses,
        ties,
        win_rate: winRate,
        ranking_position: ranking?.ranking_position,
        created_at: instance.created_at,
        updated_at: instance.updated_at,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to fetch robot instance', { error: String(error) });
    }
  }

  async recordMatch(challengerInstanceId: number, payload: RobotMatchPayload): Promise<RobotMatchResponse> {
    try {
      // Verify both instances exist
      const challenger = await this.db('robot_instances').where('id', challengerInstanceId).first();
      const opponent = await this.db('robot_instances').where('id', payload.opponent_instance_id).first();

      if (!challenger || !opponent) {
        throw new AppError(404, 'Robot instance not found');
      }

      const [matchId] = await this.db('robot_matches').insert({
        challenger_instance_id: challengerInstanceId,
        opponent_instance_id: payload.opponent_instance_id,
        match_type: payload.match_type,
        environment: payload.environment,
        result: payload.result,
        score: payload.score,
        opponent_score: payload.opponent_score,
        duration_seconds: payload.duration_seconds,
        notes: payload.notes,
        created_at: new Date(),
      });

      // Update instance stats
      const stats = await this.db('robot_instances')
        .where('id', challengerInstanceId)
        .first();

      // Get current match history
      const matches = await this.db('robot_matches')
        .where('challenger_instance_id', challengerInstanceId)
        .select('result');

      // Update robot_instances win/loss/tie counts if columns exist
      // TODO: Add these columns to migration if not present

      logger.info('Match recorded', { matchId, challengerInstanceId, opponentInstanceId: payload.opponent_instance_id });

      return this.getMatchById(matchId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to record match', { error: String(error) });
    }
  }

  async getMatchById(matchId: number): Promise<RobotMatchResponse> {
    try {
      const match = await this.db('robot_matches').where('id', matchId).first();

      if (!match) {
        throw new AppError(404, 'Match not found');
      }

      return {
        id: match.id,
        challenger_instance_id: match.challenger_instance_id,
        opponent_instance_id: match.opponent_instance_id,
        match_type: match.match_type,
        environment: match.environment,
        result: match.result,
        score: match.score,
        opponent_score: match.opponent_score,
        duration_seconds: match.duration_seconds,
        notes: match.notes,
        created_at: match.created_at,
      };
    } catch (error) {
      throw new AppError(500, 'Failed to fetch match', { error: String(error) });
    }
  }

  async getInstanceMatches(instanceId: number, limit = 20, offset = 0): Promise<RobotMatchResponse[]> {
    try {
      const matches = await this.db('robot_matches')
        .where('challenger_instance_id', instanceId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return matches;
    } catch (error) {
      throw new AppError(500, 'Failed to fetch matches', { error: String(error) });
    }
  }

  async getRankings(limit = 50, offset = 0): Promise<any[]> {
    try {
      const rankings = await this.db('robot_rankings')
        .join('robot_instances', 'robot_rankings.instance_id', 'robot_instances.id')
        .join('users', 'robot_instances.owner_id', 'users.id')
        .select(
          'robot_rankings.*',
          'robot_instances.name as instance_name',
          'users.username',
          'users.display_name'
        )
        .orderBy('robot_rankings.ranking_position', 'asc')
        .limit(limit)
        .offset(offset);

      return rankings;
    } catch (error) {
      throw new AppError(500, 'Failed to fetch rankings', { error: String(error) });
    }
  }

  async updateRankings(): Promise<void> {
    try {
      // Get all instances with match history
      const instances = await this.db('robot_instances').select('id');

      let position = 1;

      for (const instance of instances) {
        const matches = await this.db('robot_matches')
          .where('challenger_instance_id', instance.id)
          .select('result');

        const wins = matches.filter((m: any) => m.result === 'won').length;
        const total = matches.length;
        const winRate = total > 0 ? (wins / total) * 100 : 0;

        // Update or create ranking
        const existing = await this.db('robot_rankings')
          .where('instance_id', instance.id)
          .first();

        if (existing) {
          await this.db('robot_rankings')
            .where('instance_id', instance.id)
            .update({
              ranking_position: position,
              win_rate: winRate,
              total_matches: total,
              updated_at: new Date(),
            });
        } else {
          await this.db('robot_rankings').insert({
            instance_id: instance.id,
            ranking_position: position,
            win_rate: winRate,
            total_matches: total,
            created_at: new Date(),
            updated_at: new Date(),
          });
        }

        position++;
      }

      logger.info('Rankings updated');
    } catch (error) {
      logger.error('Failed to update rankings', { error });
      throw new AppError(500, 'Failed to update rankings', { error: String(error) });
    }
  }
}

export const robotService = new RobotService();
