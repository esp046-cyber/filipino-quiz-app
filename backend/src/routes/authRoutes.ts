/**
 * Authentication Routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import authController from '../controllers/authController';

const router = Router();

// Register new user
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required / Kailangan ang wastong email'),
    body('username').isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters / Ang username ay dapat 3-50 character'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters / Ang password ay dapat hindi bababa sa 8 character'),
    body('fullName').optional().isLength({ min: 2, max: 255 }),
    body('preferredLanguage').optional().isIn(['tl', 'en', 'ceb', 'ilo', 'hil']),
    body('educationLevel').optional().isString()
  ],
  validateRequest,
  authController.register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required / Kailangan ang wastong email'),
    body('password').notEmpty().withMessage('Password is required / Kailangan ang password')
  ],
  validateRequest,
  authController.login
);

// Refresh token
router.post('/refresh', authController.refreshToken);

// Logout
router.post('/logout', authController.logout);

// Verify email
router.get('/verify-email/:token', authController.verifyEmail);

// Request password reset
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Valid email is required')
  ],
  validateRequest,
  authController.forgotPassword
);

// Reset password
router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 8 })
  ],
  validateRequest,
  authController.resetPassword
);

export default router;
