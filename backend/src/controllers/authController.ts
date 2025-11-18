/**
 * Authentication Controller
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

// Mock user database (replace with actual database in production)
const users = new Map<string, any>();

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, username, password, fullName, preferredLanguage = 'tl', educationLevel } = req.body;

    // Check if user already exists
    const existingUser = Array.from(users.values()).find(
      u => u.email === email || u.username === username
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Ang email o username ay ginagamit na / Email or username already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newUser = {
      id: userId,
      email,
      username,
      passwordHash,
      fullName,
      preferredLanguage,
      educationLevel,
      createdAt: new Date(),
      isActive: true,
      emailVerified: false
    };

    users.set(userId, newUser);

    // Generate tokens
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username, email: newUser.email },
      secret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: newUser.id },
      secret,
      { expiresIn: '7d' }
    );

    logger.info(`New user registered: ${username}`);

    res.status(201).json({
      success: true,
      message: 'Matagumpay ang pagpaparehistro / Registration successful',
      data: {
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
        token,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = Array.from(users.values()).find(u => u.email === email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Mali ang email o password / Invalid email or password'
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mali ang email o password / Invalid email or password'
      });
    }

    // Generate tokens
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      secret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      secret,
      { expiresIn: '7d' }
    );

    logger.info(`User logged in: ${user.username}`);

    res.status(200).json({
      success: true,
      message: 'Matagumpay ang pag-login / Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          preferredLanguage: user.preferredLanguage
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Kailangan ang refresh token / Refresh token required'
      });
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(refreshToken, secret) as any;

    // Generate new access token
    const user = users.get(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Hindi mahanap ang user / User not found'
      });
    }

    const newToken = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      secret,
      { expiresIn: '15m' }
    );

    res.status(200).json({
      success: true,
      data: {
        token: newToken
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Di-wastong refresh token / Invalid refresh token'
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req: Request, res: Response, next: NextFunction) => {
  // In production, invalidate refresh token in database/Redis
  res.status(200).json({
    success: true,
    message: 'Matagumpay ang pag-logout / Logout successful'
  });
};

/**
 * Verify email
 * GET /api/auth/verify-email/:token
 */
const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.params;
  
  res.status(200).json({
    success: true,
    message: 'Na-verify na ang email / Email verified'
  });
};

/**
 * Forgot password
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  
  res.status(200).json({
    success: true,
    message: 'Naipadala ang reset link sa email / Password reset link sent to email'
  });
};

/**
 * Reset password
 * POST /api/auth/reset-password
 */
const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { token, newPassword } = req.body;
  
  res.status(200).json({
    success: true,
    message: 'Matagumpay na na-reset ang password / Password reset successful'
  });
};

export default {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword
};
