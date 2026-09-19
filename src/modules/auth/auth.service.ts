import { User } from '../users/user.model.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { AppError } from '../../middleware/errorHandler.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

export class AuthService {
  async register(email: string, password: string, name: string, role: 'admin' | 'student' = 'student', classLevel?: string, board?: string) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered', 409, 'CONFLICT');
    }

    const user = await User.create({
      email,
      password,
      name,
      role,
      class: classLevel,
      board,
    });

    const accessToken = signAccessToken(user._id.toString(), user.role);
    const refreshToken = signRefreshToken(user._id.toString(), user.role);

    user.refreshTokens.push(refreshToken);
    await user.save();

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        class: user.class,
        board: user.board,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email }).select('+password +refreshTokens');
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new AppError('Account is locked. Please try again later', 401, 'ACCOUNT_LOCKED');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment failed attempts
      user.failedLoginAttempts += 1;
      
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME);
      }
      
      await user.save();
      throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
    }

    // Reset failed attempts on successful login
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    const accessToken = signAccessToken(user._id.toString(), user.role);
    const refreshToken = signRefreshToken(user._id.toString(), user.role);

    user.refreshTokens.push(refreshToken);
    await user.save();

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        class: user.class,
        board: user.board,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = verifyRefreshToken(token);
      
      const user = await User.findById(decoded.userId).select('+refreshTokens');
      if (!user) {
        throw new AppError('User not found', 404, 'NOT_FOUND');
      }

      // Check if refresh token exists
      const tokenIndex = user.refreshTokens.indexOf(token);
      if (tokenIndex === -1) {
        // Token reuse detected - revoke all tokens
        user.refreshTokens = [];
        await user.save();
        throw new AppError('Refresh token reuse detected', 401, 'REFRESH_TOKEN_INVALID');
      }

      // Remove old refresh token and issue new pair
      user.refreshTokens.splice(tokenIndex, 1);
      
      const newAccessToken = signAccessToken(user._id.toString(), user.role);
      const newRefreshToken = signRefreshToken(user._id.toString(), user.role);
      
      user.refreshTokens.push(newRefreshToken);
      await user.save();

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Invalid refresh token', 401, 'REFRESH_TOKEN_INVALID');
    }
  }

  async logout(userId: string, refreshToken?: string) {
    const user = await User.findById(userId).select('+refreshTokens');
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    if (refreshToken) {
      // Remove specific refresh token
      const tokenIndex = user.refreshTokens.indexOf(refreshToken);
      if (tokenIndex !== -1) {
        user.refreshTokens.splice(tokenIndex, 1);
        await user.save();
      }
    } else {
      // Remove all refresh tokens (logout from all devices)
      user.refreshTokens = [];
      await user.save();
    }

    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      class: user.class,
      board: user.board,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, data: { name?: string; class?: string; board?: string }) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      class: user.class,
      board: user.board,
    };
  }

  // Google OAuth
  async googleLogin(googleId: string, email: string, name: string) {
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Update googleId if user exists with email but no googleId
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        googleId,
        email,
        name,
        role: 'student',
      });
    }

    const accessToken = signAccessToken(user._id.toString(), user.role);
    const refreshToken = signRefreshToken(user._id.toString(), user.role);

    user.refreshTokens.push(refreshToken);
    await user.save();

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }
}

export const authService = new AuthService();
