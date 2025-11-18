/**
 * Quiz Routes
 */

import { Router } from 'express';
import {
  startQuiz,
  submitAnswer,
  completeQuiz,
  getSessionStatus
} from '../controllers/quizController';
import { authenticate } from '../middleware/authenticate';
import { validateRequest } from '../middleware/validateRequest';
import { body, param } from 'express-validator';

const router = Router();

// All quiz routes require authentication
router.use(authenticate);

// Start a new quiz session
router.post(
  '/start',
  [
    body('topicId').isUUID().withMessage('Invalid topicId'),
    body('questionCount').optional().isInt({ min: 5, max: 50 }).withMessage('Question count must be between 5 and 50'),
    body('difficultyLevel').optional().isInt({ min: 1, max: 5 }).withMessage('Difficulty must be between 1 and 5'),
    body('scoringAlgorithm').optional().isString()
  ],
  validateRequest,
  startQuiz
);

// Submit an answer
router.post(
  '/submit-answer',
  [
    body('sessionId').isString().withMessage('SessionId is required'),
    body('questionId').isString().withMessage('QuestionId is required'),
    body('selectedOptionId').isString().withMessage('SelectedOptionId is required'),
    body('confidenceLevel').optional().isInt({ min: 1, max: 5 }),
    body('timeSpent').optional().isInt({ min: 0 })
  ],
  validateRequest,
  submitAnswer
);

// Complete quiz session
router.post(
  '/complete',
  [
    body('sessionId').isString().withMessage('SessionId is required')
  ],
  validateRequest,
  completeQuiz
);

// Get session status
router.get(
  '/session/:sessionId',
  [
    param('sessionId').isString()
  ],
  validateRequest,
  getSessionStatus
);

export default router;
