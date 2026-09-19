import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { env } from '../../config/env.js';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, role, class: classLevel, board } = req.body;
      const result = await authService.register(email, password, name, role, classLevel, board);

      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.token;
      
      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: {
            code: 'REFRESH_TOKEN_INVALID',
            message: 'No refresh token provided',
          },
        });
        return;
      }

      const result = await authService.refreshToken(refreshToken);

      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const refreshToken = req.cookies?.refreshToken;

      if (userId) {
        await authService.logout(userId, refreshToken);
      }

      res.clearCookie('refreshToken');
      res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          },
        });
        return;
      }

      const user = await authService.getMe(userId);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          },
        });
        return;
      }

      const user = await authService.updateProfile(userId, req.body);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, email, displayName } = req.user as any;
      const result = await authService.googleLogin(id, email, displayName);

      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

      // Redirect to frontend with access token
      res.redirect(`${env.CLIENT_URL}/auth/callback?token=${result.accessToken}`);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
