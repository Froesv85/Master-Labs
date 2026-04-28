import bcryptjs from 'bcryptjs';
import { getDatabase } from '../config/database';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { User } from '../types';

interface RegisterPayload {
  email: string;
  password: string;
  username: string;
  display_name: string;
  lgpd_consent: boolean;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  id: number;
  email: string;
  username: string;
  display_name: string;
  token: string;
  refresh_token: string;
  created_at: Date;
}

interface RefreshTokenPayload {
  userId: number;
  email: string;
  username: string;
}

export class AuthService {
  private db = getDatabase();

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    // Validations
    if (!payload.email || !payload.password || !payload.username) {
      throw new AppError(400, 'Missing required fields', { 
        required: ['email', 'password', 'username'] 
      });
    }

    if (payload.password.length < 8) {
      throw new AppError(400, 'Password must be at least 8 characters');
    }

    if (!payload.lgpd_consent) {
      throw new AppError(400, 'LGPD consent is required');
    }

    // Check if email already exists
    const existingEmail = await this.db('users').where('email', payload.email).first();
    if (existingEmail) {
      throw new AppError(409, 'Email already registered');
    }

    // Check if username already exists
    const existingUsername = await this.db('users').where('username', payload.username).first();
    if (existingUsername) {
      throw new AppError(409, 'Username already taken');
    }

    try {
      // Hash password
      const password_hash = await bcryptjs.hash(payload.password, 10);

      // Create user
      const [userId] = await this.db('users').insert({
        email: payload.email.toLowerCase(),
        password_hash,
        username: payload.username.toLowerCase(),
        display_name: payload.display_name,
        lgpd_consent: payload.lgpd_consent,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Create user profile
      await this.db('user_profiles').insert({
        user_id: userId,
        maker_level: 'apprentice',
        total_projects: 0,
        total_contributions: 0,
        reputation_score: 0,
        updated_at: new Date(),
      });

      // Get created user
      const user = await this.db('users').where('id', userId).first();

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        token: generateToken({
          userId: user.id,
          email: user.email,
          username: user.username,
        }),
        refresh_token: generateRefreshToken({
          userId: user.id,
          email: user.email,
          username: user.username,
        }),
        created_at: user.created_at,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to register user', { error: String(error) });
    }
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    // Validations
    if (!payload.email || !payload.password) {
      throw new AppError(400, 'Email and password are required');
    }

    try {
      // Find user
      const user = await this.db('users')
        .where('email', payload.email.toLowerCase())
        .first();

      if (!user) {
        throw new AppError(401, 'Invalid email or password');
      }

      if (!user.is_active) {
        throw new AppError(403, 'User account is inactive');
      }

      // Verify password
      const passwordValid = await bcryptjs.compare(payload.password, user.password_hash);
      if (!passwordValid) {
        throw new AppError(401, 'Invalid email or password');
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        token: generateToken({
          userId: user.id,
          email: user.email,
          username: user.username,
        }),
        refresh_token: generateRefreshToken({
          userId: user.id,
          email: user.email,
          username: user.username,
        }),
        created_at: user.created_at,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to login', { error: String(error) });
    }
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; refresh_token: string }> {
    if (!refreshToken) {
      throw new AppError(400, 'Refresh token is required');
    }

    try {
      // Verify refresh token and get user info
      const { verifyRefreshToken } = require('../utils/jwt');
      const decoded = verifyRefreshToken(refreshToken);

      // Get fresh user data
      const user = await this.db('users').where('id', decoded.userId).first();

      if (!user || !user.is_active) {
        throw new AppError(401, 'User not found or inactive');
      }

      return {
        token: generateToken({
          userId: user.id,
          email: user.email,
          username: user.username,
        }),
        refresh_token: generateRefreshToken({
          userId: user.id,
          email: user.email,
          username: user.username,
        }),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(401, 'Invalid refresh token', { error: String(error) });
    }
  }

  async validateToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const { verifyToken } = require('../utils/jwt');
      return verifyToken(token);
    } catch (error) {
      throw new AppError(401, 'Invalid token');
    }
  }
}

export const authService = new AuthService();
