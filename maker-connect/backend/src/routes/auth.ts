import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AppError } from '../middleware/errorHandler';

export const authRouter = Router();

// POST /auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, username, display_name, lgpd_consent } = req.body;

    const result = await authService.register({
      email,
      password,
      username,
      display_name,
      lgpd_consent,
    });

    res.status(201).json({
      data: result,
      message: 'User registered successfully',
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

// POST /auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login({
      email,
      password,
    });

    res.status(200).json({
      data: result,
      message: 'Login successful',
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

// POST /auth/refresh
authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      throw new AppError(400, 'Refresh token is required');
    }

    const result = await authService.refreshToken(refresh_token);

    res.status(200).json({
      data: result,
      message: 'Token refreshed successfully',
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

// POST /auth/validate (internal use)
authRouter.post('/validate', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    const result = await authService.validateToken(token);

    res.status(200).json({
      data: result,
      message: 'Token is valid',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
    throw error;
  }
});
