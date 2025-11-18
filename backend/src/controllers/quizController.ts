/**
 * Quiz Controller
 * Handles all quiz-related operations including adaptive question selection
 */

import { Request, Response, NextFunction } from 'express';
import {
  ScoringStrategyFactory,
  ScoringContext,
  Question,
  Answer,
  UserPerformanceMetrics
} from '../strategies/scoringStrategies';
import { logger } from '../utils/logger';

// ============================================================================
// TYPES
// ============================================================================

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

interface QuizSession {
  id: string;
  userId: string;
  topicId: string;
  questions: Question[];
  currentQuestionIndex: number;
  totalQuestions: number;
  rawScore: number;
  maxPossibleScore: number;
  scoringAlgorithm: string;
  difficultyLevel: number;
  startedAt: Date;
  answers: Answer[];
}

// In-memory session storage (would use Redis in production)
const activeSessions = new Map<string, QuizSession>();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Select questions based on adaptive difficulty
 */
function selectAdaptiveQuestions(
  availableQuestions: Question[],
  count: number,
  userPerformance: UserPerformanceMetrics,
  currentDifficulty: number
): Question[] {
  // Determine target difficulty based on user performance
  let targetDifficulty = currentDifficulty;

  if (userPerformance.recentAccuracy > 80 && userPerformance.consecutiveCorrect >= 3) {
    targetDifficulty = Math.min(5, currentDifficulty + 1);
  } else if (userPerformance.recentAccuracy < 50 && userPerformance.consecutiveIncorrect >= 3) {
    targetDifficulty = Math.max(1, currentDifficulty - 1);
  }

  // Filter questions near target difficulty (±1 level)
  const suitableQuestions = availableQuestions.filter(q => 
    Math.abs(q.difficultyLevel - targetDifficulty) <= 1
  );

  // Shuffle and select
  const shuffled = suitableQuestions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Calculate user performance metrics from history
 */
async function getUserPerformanceMetrics(userId: string, topicId: string): Promise<UserPerformanceMetrics> {
  // In production, fetch from database
  // For now, return mock data
  return {
    recentAccuracy: 75.5,
    averageResponseTime: 15,
    consecutiveCorrect: 2,
    consecutiveIncorrect: 0,
    currentStreak: 5
  };
}

/**
 * Generate session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// CONTROLLER FUNCTIONS
// ============================================================================

/**
 * Start a new quiz session
 * POST /api/quiz/start
 */
export const startQuiz = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { topicId, questionCount = 20, difficultyLevel = 3, scoringAlgorithm = 'standard' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Hindi awtorisado / Unauthorized'
      });
    }

    // Validate inputs
    if (!topicId) {
      return res.status(400).json({
        success: false,
        message: 'Kailangan ang topicId / topicId is required'
      });
    }

    // Get user performance metrics
    const userPerformance = await getUserPerformanceMetrics(userId, topicId);

    // Mock question bank (in production, fetch from database)
    const mockQuestions: Question[] = generateMockQuestions(topicId, questionCount, difficultyLevel);

    // Select adaptive questions
    const selectedQuestions = selectAdaptiveQuestions(
      mockQuestions,
      questionCount,
      userPerformance,
      difficultyLevel
    );

    // Create session
    const sessionId = generateSessionId();
    const session: QuizSession = {
      id: sessionId,
      userId,
      topicId,
      questions: selectedQuestions,
      currentQuestionIndex: 0,
      totalQuestions: selectedQuestions.length,
      rawScore: 0,
      maxPossibleScore: selectedQuestions.reduce((sum, q) => sum + q.points, 0),
      scoringAlgorithm,
      difficultyLevel,
      startedAt: new Date(),
      answers: []
    };

    activeSessions.set(sessionId, session);

    logger.info(`Quiz session started: ${sessionId} for user ${userId}`);

    // Return first question (hide correct answers)
    const sanitizedQuestions = selectedQuestions.map(q => ({
      id: q.id,
      points: q.points,
      difficultyLevel: q.difficultyLevel,
      options: q.options.map(opt => ({
        id: opt.id,
        // Don't send isCorrect or partialCreditPercentage to client
      }))
    }));

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        totalQuestions: selectedQuestions.length,
        scoringAlgorithm,
        questions: sanitizedQuestions,
        currentDifficulty: difficultyLevel
      }
    });
  } catch (error) {
    logger.error('Error starting quiz:', error);
    next(error);
  }
};

/**
 * Submit an answer to a question
 * POST /api/quiz/submit-answer
 */
export const submitAnswer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      sessionId,
      questionId,
      selectedOptionId,
      confidenceLevel,
      timeSpent
    } = req.body;

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Hindi awtorisado / Unauthorized'
      });
    }

    // Get session
    const session = activeSessions.get(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Hindi mahanap ang session / Session not found'
      });
    }

    // Find question
    const question = session.questions.find(q => q.id === questionId);
    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Hindi wastong tanong / Invalid question'
      });
    }

    // Check if already answered
    const alreadyAnswered = session.answers.find(a => a.questionId === questionId);
    if (alreadyAnswered) {
      return res.status(400).json({
        success: false,
        message: 'Nasagot na ang tanong / Question already answered'
      });
    }

    // Determine if answer is correct
    const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
    const isCorrect = selectedOption?.isCorrect || false;

    // Create answer object
    const answer: Answer = {
      questionId,
      selectedOptionId,
      isCorrect,
      confidenceLevel,
      timeSpent
    };

    // Get user performance for adaptive scoring
    const userPerformance = await getUserPerformanceMetrics(userId, session.topicId);

    // Calculate score using selected strategy
    const strategy = ScoringStrategyFactory.getStrategy(session.scoringAlgorithm);
    const scoringContext: ScoringContext = {
      question,
      answer,
      userPerformance
    };

    const scoringResult = strategy.calculateScore(scoringContext);

    // Update session
    session.answers.push(answer);
    session.rawScore += scoringResult.pointsEarned;
    session.currentQuestionIndex++;

    activeSessions.set(sessionId, session);

    // Calculate percentage
    const percentageScore = (session.rawScore / session.maxPossibleScore) * 100;

    logger.info(`Answer submitted for session ${sessionId}: ${isCorrect ? 'correct' : 'incorrect'}`);

    // Emit real-time update via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${userId}`).emit('score-updated', {
        sessionId,
        currentScore: percentageScore,
        pointsEarned: scoringResult.pointsEarned
      });
    }

    res.status(200).json({
      success: true,
      data: {
        isCorrect,
        pointsEarned: scoringResult.pointsEarned,
        pointsPossible: scoringResult.pointsPossible,
        currentScore: percentageScore,
        questionsRemaining: session.totalQuestions - session.answers.length,
        feedback: scoringResult.feedback,
        explanation: isCorrect ? 'Tama ang sagot!' : 'Mali ang sagot. Subukan muli.',
        appliedMultipliers: scoringResult.appliedMultipliers
      }
    });
  } catch (error) {
    logger.error('Error submitting answer:', error);
    next(error);
  }
};

/**
 * Complete a quiz session
 * POST /api/quiz/complete
 */
export const completeQuiz = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Hindi awtorisado / Unauthorized'
      });
    }

    const session = activeSessions.get(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Hindi mahanap ang session / Session not found'
      });
    }

    const percentageScore = (session.rawScore / session.maxPossibleScore) * 100;
    const correctAnswers = session.answers.filter(a => a.isCorrect).length;
    const totalTime = session.answers.reduce((sum, a) => sum + (a.timeSpent || 0), 0);

    // Calculate strength and weakness areas
    const topicAnalysis = {
      topicId: session.topicId,
      accuracy: (correctAnswers / session.totalQuestions) * 100,
      averageTime: totalTime / session.totalQuestions
    };

    // Determine if new achievements were earned (mock)
    const newAchievements: string[] = [];
    if (percentageScore === 100) {
      newAchievements.push('PERFECT_SCORE');
    }
    if (totalTime < 300) { // Less than 5 minutes
      newAchievements.push('SPEED_MASTER');
    }

    // In production, save to database here
    logger.info(`Quiz completed: ${sessionId} with score ${percentageScore.toFixed(2)}%`);

    // Clean up session
    activeSessions.delete(sessionId);

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        finalScore: percentageScore,
        rawScore: session.rawScore,
        maxPossibleScore: session.maxPossibleScore,
        totalQuestions: session.totalQuestions,
        correctAnswers,
        incorrectAnswers: session.totalQuestions - correctAnswers,
        timeSpent: totalTime,
        averageTimePerQuestion: totalTime / session.totalQuestions,
        newAchievements,
        topicAnalysis,
        performanceSummary: {
          excellent: percentageScore >= 90,
          good: percentageScore >= 75 && percentageScore < 90,
          needsImprovement: percentageScore < 75
        },
        recommendation: percentageScore >= 80
          ? 'Magaling! Subukan ang mas mahirap na mga tanong. / Excellent! Try harder questions.'
          : 'Magpatuloy sa pag-aaral. / Keep practicing.'
      }
    });
  } catch (error) {
    logger.error('Error completing quiz:', error);
    next(error);
  }
};

/**
 * Get current quiz session status
 * GET /api/quiz/session/:sessionId
 */
export const getSessionStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Hindi awtorisado / Unauthorized'
      });
    }

    const session = activeSessions.get(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Hindi mahanap ang session / Session not found'
      });
    }

    const percentageScore = (session.rawScore / session.maxPossibleScore) * 100;

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        currentScore: percentageScore,
        questionsAnswered: session.answers.length,
        totalQuestions: session.totalQuestions,
        timeElapsed: Math.floor((Date.now() - session.startedAt.getTime()) / 1000),
        currentDifficulty: session.difficultyLevel
      }
    });
  } catch (error) {
    logger.error('Error getting session status:', error);
    next(error);
  }
};

// ============================================================================
// MOCK DATA GENERATOR (Replace with DB queries in production)
// ============================================================================

function generateMockQuestions(topicId: string, count: number, baseDifficulty: number): Question[] {
  const questions: Question[] = [];
  
  const filipinoQuestions = [
    {
      tl: 'Ano ang pangunahing layunin ng edukasyon?',
      en: 'What is the main purpose of education?',
      options: [
        { tl: 'Kumita ng pera', en: 'To earn money', correct: false, partial: 25 },
        { tl: 'Paglinang ng kaalaman at kasanayan', en: 'To develop knowledge and skills', correct: true, partial: 100 },
        { tl: 'Makakuha ng diploma', en: 'To get a diploma', correct: false, partial: 15 },
        { tl: 'Maging sikat', en: 'To become famous', correct: false, partial: 0 }
      ]
    },
    {
      tl: 'Sino ang pambansang bayani ng Pilipinas?',
      en: 'Who is the national hero of the Philippines?',
      options: [
        { tl: 'Andres Bonifacio', en: 'Andres Bonifacio', correct: false, partial: 40 },
        { tl: 'Jose Rizal', en: 'Jose Rizal', correct: true, partial: 100 },
        { tl: 'Emilio Aguinaldo', en: 'Emilio Aguinaldo', correct: false, partial: 30 },
        { tl: 'Apolinario Mabini', en: 'Apolinario Mabini', correct: false, partial: 20 }
      ]
    },
    {
      tl: 'Ilang pulo ang nasa Pilipinas?',
      en: 'How many islands are in the Philippines?',
      options: [
        { tl: 'Mahigit 5,000', en: 'More than 5,000', correct: false, partial: 25 },
        { tl: 'Mahigit 7,000', en: 'More than 7,000', correct: true, partial: 100 },
        { tl: 'Mahigit 10,000', en: 'More than 10,000', correct: false, partial: 0 },
        { tl: 'Mahigit 3,000', en: 'More than 3,000', correct: false, partial: 0 }
      ]
    }
  ];

  for (let i = 0; i < count; i++) {
    const template = filipinoQuestions[i % filipinoQuestions.length];
    const difficultyVariation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    const difficulty = Math.max(1, Math.min(5, baseDifficulty + difficultyVariation));

    questions.push({
      id: `q_${topicId}_${i}`,
      points: difficulty,
      difficultyLevel: difficulty,
      options: template.options.map((opt, idx) => ({
        id: `opt_${i}_${idx}`,
        isCorrect: opt.correct,
        partialCreditPercentage: opt.partial
      }))
    });
  }

  return questions;
}

export default {
  startQuiz,
  submitAnswer,
  completeQuiz,
  getSessionStatus
};
