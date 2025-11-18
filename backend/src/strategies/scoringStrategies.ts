/**
 * Scoring Strategies - Strategy Pattern Implementation
 * Filipino Adaptive Quiz Application
 * 
 * This module implements various scoring algorithms for quiz questions,
 * allowing flexible scoring based on different pedagogical approaches.
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface Question {
  id: string;
  points: number;
  difficultyLevel: number;
  options: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  isCorrect: boolean;
  partialCreditPercentage: number;
}

export interface Answer {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  confidenceLevel?: number; // 1-5 scale
  timeSpent?: number; // seconds
}

export interface ScoringResult {
  pointsEarned: number;
  pointsPossible: number;
  percentage: number;
  feedback: string;
  appliedMultipliers: string[];
}

export interface ScoringContext {
  question: Question;
  answer: Answer;
  userPerformance?: UserPerformanceMetrics;
}

export interface UserPerformanceMetrics {
  recentAccuracy: number; // percentage
  averageResponseTime: number; // seconds
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  currentStreak: number;
}

// ============================================================================
// ABSTRACT STRATEGY CLASS
// ============================================================================

export abstract class ScoringStrategy {
  abstract calculateScore(context: ScoringContext): ScoringResult;

  protected getSelectedOption(question: Question, answer: Answer): QuestionOption | undefined {
    return question.options.find(opt => opt.id === answer.selectedOptionId);
  }

  protected getCorrectOption(question: Question): QuestionOption | undefined {
    return question.options.find(opt => opt.isCorrect);
  }

  protected formatFeedback(
    isCorrect: boolean,
    pointsEarned: number,
    language: string = 'tl'
  ): string {
    if (language === 'tl') {
      if (isCorrect) {
        return pointsEarned > 0
          ? `Tama! Nakakuha ka ng ${pointsEarned.toFixed(1)} puntos.`
          : 'Tama ang sagot!';
      } else {
        return pointsEarned < 0
          ? `Mali. Nabawasan ng ${Math.abs(pointsEarned).toFixed(1)} puntos.`
          : 'Mali ang sagot. Subukan muli.';
      }
    } else {
      if (isCorrect) {
        return pointsEarned > 0
          ? `Correct! You earned ${pointsEarned.toFixed(1)} points.`
          : 'Correct answer!';
      } else {
        return pointsEarned < 0
          ? `Incorrect. Lost ${Math.abs(pointsEarned).toFixed(1)} points.`
          : 'Incorrect answer. Try again.';
      }
    }
  }
}

// ============================================================================
// CONCRETE STRATEGY IMPLEMENTATIONS
// ============================================================================

/**
 * Standard Scoring Strategy
 * - Correct answer = full points
 * - Incorrect answer = 0 points
 * - Simple and straightforward
 */
export class StandardScoring extends ScoringStrategy {
  calculateScore(context: ScoringContext): ScoringResult {
    const { question, answer } = context;
    const pointsEarned = answer.isCorrect ? question.points : 0;

    return {
      pointsEarned,
      pointsPossible: question.points,
      percentage: (pointsEarned / question.points) * 100,
      feedback: this.formatFeedback(answer.isCorrect, pointsEarned),
      appliedMultipliers: ['standard']
    };
  }
}

/**
 * Negative Penalty Scoring Strategy
 * - Correct answer = full points
 * - Incorrect answer = negative points (penalty)
 * - Discourages random guessing
 * - Penalty percentage configurable
 */
export class NegativePenaltyScoring extends ScoringStrategy {
  constructor(private penaltyPercentage: number = 25) {
    super();
  }

  calculateScore(context: ScoringContext): ScoringResult {
    const { question, answer } = context;
    
    let pointsEarned: number;
    if (answer.isCorrect) {
      pointsEarned = question.points;
    } else {
      // Apply negative penalty
      pointsEarned = -(question.points * (this.penaltyPercentage / 100));
    }

    return {
      pointsEarned,
      pointsPossible: question.points,
      percentage: answer.isCorrect ? 100 : (this.penaltyPercentage * -1),
      feedback: this.formatFeedback(answer.isCorrect, pointsEarned),
      appliedMultipliers: ['negative_penalty', `${this.penaltyPercentage}%`]
    };
  }
}

/**
 * Partial Credit Scoring Strategy
 * - Correct answer = full points
 * - Partially correct answer = percentage of points
 * - Incorrect answer = 0 points
 * - Based on option's partialCreditPercentage value
 */
export class PartialCreditScoring extends ScoringStrategy {
  calculateScore(context: ScoringContext): ScoringResult {
    const { question, answer } = context;
    const selectedOption = this.getSelectedOption(question, answer);

    if (!selectedOption) {
      return {
        pointsEarned: 0,
        pointsPossible: question.points,
        percentage: 0,
        feedback: 'Walang napiling sagot / No answer selected',
        appliedMultipliers: []
      };
    }

    let pointsEarned: number;
    let percentage: number;

    if (selectedOption.isCorrect) {
      pointsEarned = question.points;
      percentage = 100;
    } else if (selectedOption.partialCreditPercentage > 0) {
      pointsEarned = question.points * (selectedOption.partialCreditPercentage / 100);
      percentage = selectedOption.partialCreditPercentage;
    } else {
      pointsEarned = 0;
      percentage = 0;
    }

    const feedback = percentage > 0 && percentage < 100
      ? `Bahagyang tama! Nakakuha ka ng ${percentage}% ng puntos. / Partially correct! You earned ${percentage}% of the points.`
      : this.formatFeedback(answer.isCorrect, pointsEarned);

    return {
      pointsEarned,
      pointsPossible: question.points,
      percentage,
      feedback,
      appliedMultipliers: ['partial_credit', `${percentage}%`]
    };
  }
}

/**
 * Confidence-Based Scoring Strategy
 * - High confidence (4-5) correct = double points
 * - High confidence incorrect = double penalty
 * - Low confidence correct = standard points
 * - Low confidence incorrect = reduced penalty
 * - Encourages self-awareness and honest assessment
 */
export class ConfidenceBasedScoring extends ScoringStrategy {
  constructor(
    private highConfidenceThreshold: number = 4,
    private highConfidenceMultiplier: number = 2.0,
    private basePenaltyPercentage: number = 25
  ) {
    super();
  }

  calculateScore(context: ScoringContext): ScoringResult {
    const { question, answer } = context;
    const confidence = answer.confidenceLevel || 3; // Default to medium confidence
    const isHighConfidence = confidence >= this.highConfidenceThreshold;

    let pointsEarned: number;
    let multiplier: number = 1.0;
    const multipliers: string[] = ['confidence_based'];

    if (answer.isCorrect) {
      pointsEarned = question.points;
      if (isHighConfidence) {
        pointsEarned *= this.highConfidenceMultiplier;
        multiplier = this.highConfidenceMultiplier;
        multipliers.push(`high_confidence_bonus_${multiplier}x`);
      }
    } else {
      // Incorrect answer
      const basePenalty = -(question.points * (this.basePenaltyPercentage / 100));
      if (isHighConfidence) {
        pointsEarned = basePenalty * this.highConfidenceMultiplier;
        multiplier = this.highConfidenceMultiplier;
        multipliers.push(`high_confidence_penalty_${multiplier}x`);
      } else {
        pointsEarned = basePenalty * 0.5; // Reduced penalty for low confidence
        multiplier = 0.5;
        multipliers.push(`low_confidence_reduced_penalty_${multiplier}x`);
      }
    }

    const percentage = (pointsEarned / question.points) * 100;
    const confidenceFeedback = isHighConfidence
      ? ' (Mataas na kumpiyansa / High confidence)'
      : ' (Mababang kumpiyansa / Low confidence)';

    return {
      pointsEarned,
      pointsPossible: question.points * (isHighConfidence && answer.isCorrect ? this.highConfidenceMultiplier : 1),
      percentage: Math.min(100, Math.max(-100, percentage)),
      feedback: this.formatFeedback(answer.isCorrect, pointsEarned) + confidenceFeedback,
      appliedMultipliers: multipliers
    };
  }
}

/**
 * Threshold Scoring Strategy
 * - Scores below minimum threshold are set to 0%
 * - Used for pass/fail scenarios
 * - Prevents very low scores from being recorded
 */
export class ThresholdScoring extends ScoringStrategy {
  constructor(
    private minimumThreshold: number = 40, // 40% minimum
    private baseStrategy: ScoringStrategy = new StandardScoring()
  ) {
    super();
  }

  calculateScore(context: ScoringContext): ScoringResult {
    const baseResult = this.baseStrategy.calculateScore(context);

    if (baseResult.percentage < this.minimumThreshold) {
      return {
        ...baseResult,
        pointsEarned: 0,
        percentage: 0,
        feedback: `${baseResult.feedback} (Mas mababa sa minimum threshold / Below minimum threshold)`,
        appliedMultipliers: [...baseResult.appliedMultipliers, `threshold_${this.minimumThreshold}%`]
      };
    }

    return {
      ...baseResult,
      appliedMultipliers: [...baseResult.appliedMultipliers, 'threshold_passed']
    };
  }
}

/**
 * Time-Based Scoring Strategy
 * - Bonus points for fast correct answers
 * - No penalty for slow answers (encourages thinking)
 * - Speed bonus decreases linearly with time
 */
export class TimeBasedScoring extends ScoringStrategy {
  constructor(
    private fastThresholdSeconds: number = 10,
    private slowThresholdSeconds: number = 60,
    private maxSpeedBonus: number = 0.5 // 50% bonus
  ) {
    super();
  }

  calculateScore(context: ScoringContext): ScoringResult {
    const { question, answer } = context;
    const timeSpent = answer.timeSpent || this.slowThresholdSeconds;

    let pointsEarned = answer.isCorrect ? question.points : 0;
    let speedBonus = 0;
    const multipliers: string[] = ['time_based'];

    if (answer.isCorrect && timeSpent <= this.fastThresholdSeconds) {
      // Fast and correct - apply full speed bonus
      speedBonus = question.points * this.maxSpeedBonus;
      pointsEarned += speedBonus;
      multipliers.push(`speed_bonus_${this.maxSpeedBonus * 100}%`);
    } else if (answer.isCorrect && timeSpent < this.slowThresholdSeconds) {
      // Medium speed - apply partial bonus
      const speedRatio = 1 - ((timeSpent - this.fastThresholdSeconds) / (this.slowThresholdSeconds - this.fastThresholdSeconds));
      speedBonus = question.points * this.maxSpeedBonus * speedRatio;
      pointsEarned += speedBonus;
      multipliers.push(`speed_bonus_${(speedBonus / question.points * 100).toFixed(0)}%`);
    }

    const percentage = (pointsEarned / question.points) * 100;
    const timeFeedback = speedBonus > 0
      ? ` (Mabilis na sagot! Bonus: +${speedBonus.toFixed(1)} / Fast answer! Bonus: +${speedBonus.toFixed(1)})`
      : '';

    return {
      pointsEarned,
      pointsPossible: question.points * (1 + this.maxSpeedBonus),
      percentage: Math.min(100 + (this.maxSpeedBonus * 100), percentage),
      feedback: this.formatFeedback(answer.isCorrect, pointsEarned) + timeFeedback,
      appliedMultipliers: multipliers
    };
  }
}

/**
 * Adaptive Difficulty Scoring Strategy
 * - Adjusts points based on question difficulty
 * - Higher difficulty = more points
 * - Considers user's performance history
 */
export class AdaptiveDifficultyScoring extends ScoringStrategy {
  calculateScore(context: ScoringContext): ScoringResult {
    const { question, answer, userPerformance } = context;
    
    // Base difficulty multiplier (1x to 2x based on difficulty level 1-5)
    const difficultyMultiplier = 1 + ((question.difficultyLevel - 1) * 0.25);
    
    // Performance adjustment
    let performanceMultiplier = 1.0;
    if (userPerformance) {
      // If user is struggling (low accuracy), give more credit for correct answers
      if (userPerformance.recentAccuracy < 60) {
        performanceMultiplier = 1.2;
      }
      // If user is excelling, slightly reduce points (they don't need as much encouragement)
      else if (userPerformance.recentAccuracy > 90) {
        performanceMultiplier = 0.9;
      }
    }

    const adjustedPoints = question.points * difficultyMultiplier;
    const pointsEarned = answer.isCorrect ? adjustedPoints * performanceMultiplier : 0;
    const percentage = answer.isCorrect ? 100 : 0;

    const multipliers = [
      'adaptive_difficulty',
      `difficulty_${difficultyMultiplier.toFixed(2)}x`,
      `performance_${performanceMultiplier.toFixed(2)}x`
    ];

    const difficultyFeedback = question.difficultyLevel >= 4
      ? ' (Mahirap na tanong! / Difficult question!)'
      : question.difficultyLevel <= 2
      ? ' (Madaling tanong / Easy question)'
      : '';

    return {
      pointsEarned,
      pointsPossible: adjustedPoints,
      percentage,
      feedback: this.formatFeedback(answer.isCorrect, pointsEarned) + difficultyFeedback,
      appliedMultipliers: multipliers
    };
  }
}

/**
 * Combo/Streak Scoring Strategy
 * - Bonus multiplier for consecutive correct answers
 * - Resets on incorrect answer
 * - Encourages sustained performance
 */
export class ComboStreakScoring extends ScoringStrategy {
  constructor(
    private streakBonusPerCorrect: number = 0.1, // 10% per correct
    private maxStreakMultiplier: number = 2.0 // Maximum 2x
  ) {
    super();
  }

  calculateScore(context: ScoringContext): ScoringResult {
    const { question, answer, userPerformance } = context;
    const consecutiveCorrect = userPerformance?.consecutiveCorrect || 0;

    // Calculate streak multiplier
    const streakMultiplier = Math.min(
      this.maxStreakMultiplier,
      1 + (consecutiveCorrect * this.streakBonusPerCorrect)
    );

    let pointsEarned = 0;
    const multipliers: string[] = ['combo_streak'];

    if (answer.isCorrect) {
      pointsEarned = question.points * streakMultiplier;
      if (consecutiveCorrect > 0) {
        multipliers.push(`streak_${consecutiveCorrect}`, `multiplier_${streakMultiplier.toFixed(2)}x`);
      }
    }

    const percentage = answer.isCorrect ? 100 : 0;
    const streakFeedback = consecutiveCorrect >= 3 && answer.isCorrect
      ? ` (Combo x${consecutiveCorrect + 1}! Multiplier: ${streakMultiplier.toFixed(2)}x)`
      : consecutiveCorrect > 0 && !answer.isCorrect
      ? ` (Combo broken / Naputol ang combo)`
      : '';

    return {
      pointsEarned,
      pointsPossible: question.points * streakMultiplier,
      percentage,
      feedback: this.formatFeedback(answer.isCorrect, pointsEarned) + streakFeedback,
      appliedMultipliers: multipliers
    };
  }
}

// ============================================================================
// STRATEGY FACTORY
// ============================================================================

export class ScoringStrategyFactory {
  private static strategies: Map<string, ScoringStrategy> = new Map([
    ['standard', new StandardScoring()],
    ['negative_penalty', new NegativePenaltyScoring(25)],
    ['partial_credit', new PartialCreditScoring()],
    ['confidence_based', new ConfidenceBasedScoring()],
    ['threshold', new ThresholdScoring(40)],
    ['time_based', new TimeBasedScoring()],
    ['adaptive_difficulty', new AdaptiveDifficultyScoring()],
    ['combo_streak', new ComboStreakScoring()]
  ]);

  static getStrategy(strategyName: string): ScoringStrategy {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      console.warn(`Strategy '${strategyName}' not found, falling back to standard scoring`);
      return this.strategies.get('standard')!;
    }
    return strategy;
  }

  static registerStrategy(name: string, strategy: ScoringStrategy): void {
    this.strategies.set(name, strategy);
  }

  static getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }
}

// ============================================================================
// COMPOSITE STRATEGY (Combine Multiple Strategies)
// ============================================================================

export class CompositeScoring extends ScoringStrategy {
  constructor(private strategies: ScoringStrategy[]) {
    super();
  }

  calculateScore(context: ScoringContext): ScoringResult {
    // Apply all strategies and aggregate results
    const results = this.strategies.map(strategy => strategy.calculateScore(context));
    
    // Sum all points earned
    const totalPointsEarned = results.reduce((sum, result) => sum + result.pointsEarned, 0);
    const totalPointsPossible = results.reduce((sum, result) => sum + result.pointsPossible, 0);
    
    // Combine multipliers
    const allMultipliers = results.flatMap(result => result.appliedMultipliers);
    
    // Combine feedback
    const combinedFeedback = results.map(r => r.feedback).join(' | ');

    return {
      pointsEarned: totalPointsEarned,
      pointsPossible: totalPointsPossible,
      percentage: (totalPointsEarned / totalPointsPossible) * 100,
      feedback: combinedFeedback,
      appliedMultipliers: ['composite', ...allMultipliers]
    };
  }
}
