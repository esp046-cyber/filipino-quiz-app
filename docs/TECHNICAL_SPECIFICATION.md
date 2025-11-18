# Filipino Adaptive Quiz Application - Technical Specification

## Document Information
- **Version:** 1.0.0
- **Last Updated:** 2025-11-18
- **Author:** MiniMax Agent
- **Status:** Implementation-Ready

---

## 1. Executive Summary

The Filipino Adaptive Quiz Application is a comprehensive educational platform designed specifically for Filipino learners, featuring adaptive scoring, multi-language support (Tagalog, Cebuano, and other Philippine languages), and advanced analytics. The system implements intelligent difficulty adjustment, cultural context integration, and gamification to enhance learning outcomes.

### 1.1 Core Capabilities
- **Adaptive Scoring:** Percentage-based scoring (-100% to 100%) with partial credit
- **Multi-Language Support:** Tagalog, Cebuano, Ilocano, Hiligaynon
- **Real-time Analytics:** Performance tracking with weakness identification
- **Gamification:** Badges, leaderboards, milestone tracking
- **Offline Mode:** Progressive Web App with sync capabilities

---

## 2. System Architecture

### 2.1 Technology Stack

#### Frontend
- **Framework:** React 18.x with TypeScript
- **State Management:** Redux Toolkit + RTK Query
- **UI Library:** Material-UI (MUI) v5
- **Charting:** Recharts for analytics visualization
- **Offline Support:** Workbox (Service Worker)
- **Build Tool:** Vite

#### Backend
- **Runtime:** Node.js 20.x LTS
- **Framework:** Express.js 4.x with TypeScript
- **ORM:** Prisma (type-safe database access)
- **Authentication:** JWT + bcrypt
- **Real-time:** Socket.io for live updates
- **Validation:** Zod for schema validation
- **Testing:** Jest + Supertest

#### Database
- **Primary DB:** PostgreSQL 15.x
- **Caching:** Redis 7.x (session management, leaderboards)
- **Search:** PostgreSQL Full-Text Search
- **Backup:** Automated pg_dump with retention policy

#### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** Nginx
- **Cloud Storage:** AWS S3 / Cloudflare R2 (multimedia)
- **CDN:** Cloudflare (static assets)
- **Monitoring:** Prometheus + Grafana

### 2.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Desktop    │  │    Mobile    │  │    Tablet    │     │
│  │   Browser    │  │   Browser    │  │   Browser    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │   CDN/Nginx     │
                    │  (Load Balance) │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼──────┐    ┌─────▼──────┐    ┌─────▼──────┐
    │  Express   │    │  Express   │    │ WebSocket  │
    │  API (1)   │    │  API (2)   │    │   Server   │
    └─────┬──────┘    └─────┬──────┘    └─────┬──────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼──────┐    ┌─────▼──────┐    ┌─────▼──────┐
    │ PostgreSQL │    │   Redis    │    │    S3      │
    │  Database  │    │   Cache    │    │  Storage   │
    └────────────┘    └────────────┘    └────────────┘
```

### 2.3 System Components

#### 2.3.1 Scoring Engine (Strategy Pattern)
```typescript
interface ScoringStrategy {
  calculateScore(
    question: Question,
    userAnswer: Answer,
    confidence?: number
  ): ScoringResult;
}

// Implementations:
- StandardScoring: Basic correct/incorrect
- PartialCreditScoring: Weighted answer options
- ConfidenceBasedScoring: Double points/penalties
- ThresholdScoring: Minimum score requirements
- NegativePenaltyScoring: Guessing discouragement
```

#### 2.3.2 Question Management System
- **Question Bank:** Categorized by subject, difficulty, language
- **Dynamic Loading:** Load questions based on user performance
- **Content Delivery:** Multimedia support (images, audio)
- **Version Control:** Track question revisions

#### 2.3.3 Analytics Engine
- **Performance Metrics:** Accuracy, speed, consistency
- **Topic Analysis:** Strength/weakness identification
- **Trend Analysis:** Progress over time
- **Predictive Modeling:** Difficulty recommendations

---

## 3. Database Schema

### 3.1 Entity-Relationship Model

```
Users ──< UserProgress >── Topics
  │                           │
  ├──< QuizSessions          │
  │         │                 │
  │         └──< QuizAnswers  │
  │                  │        │
  ├──< Achievements  │        │
  │                  │        │
  └──< UserSettings  │        │
                     │        │
              Questions ──────┘
                  │
                  └──< QuestionOptions
```

### 3.2 Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255),
  preferred_language VARCHAR(10) DEFAULT 'tl',
  education_level VARCHAR(50),
  date_of_birth DATE,
  profile_image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

#### Questions Table
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  language VARCHAR(10) NOT NULL,
  topic_id UUID REFERENCES topics(id),
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  question_type VARCHAR(50) DEFAULT 'multiple_choice',
  points INTEGER DEFAULT 1,
  explanation TEXT,
  cultural_context TEXT,
  media_url TEXT,
  media_type VARCHAR(20),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  correct_rate DECIMAL(5,2)
);

CREATE INDEX idx_questions_topic ON questions(topic_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty_level);
CREATE INDEX idx_questions_language ON questions(language);
```

#### Question_Options Table
```sql
CREATE TABLE question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  partial_credit_percentage DECIMAL(5,2) DEFAULT 0.0,
  option_order INTEGER,
  explanation TEXT
);

CREATE INDEX idx_options_question ON question_options(question_id);
```

#### Quiz_Sessions Table
```sql
CREATE TABLE quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  topic_id UUID REFERENCES topics(id),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  total_questions INTEGER,
  questions_answered INTEGER DEFAULT 0,
  raw_score DECIMAL(6,2) DEFAULT 0.0,
  percentage_score DECIMAL(5,2),
  time_spent_seconds INTEGER,
  scoring_algorithm VARCHAR(50),
  is_completed BOOLEAN DEFAULT FALSE,
  session_metadata JSONB
);

CREATE INDEX idx_sessions_user ON quiz_sessions(user_id);
CREATE INDEX idx_sessions_completed ON quiz_sessions(completed_at);
```

#### Quiz_Answers Table
```sql
CREATE TABLE quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id),
  selected_option_id UUID REFERENCES question_options(id),
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
  is_correct BOOLEAN,
  points_earned DECIMAL(6,2),
  time_taken_seconds INTEGER,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  was_bookmarked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_answers_session ON quiz_answers(session_id);
CREATE INDEX idx_answers_question ON quiz_answers(question_id);
```

#### User_Progress Table
```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  topic_id UUID REFERENCES topics(id),
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  average_accuracy DECIMAL(5,2),
  average_time_per_question INTEGER,
  current_difficulty_level INTEGER,
  total_points_earned INTEGER DEFAULT 0,
  last_attempted TIMESTAMP,
  strength_score DECIMAL(5,2),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, topic_id)
);

CREATE INDEX idx_progress_user ON user_progress(user_id);
CREATE INDEX idx_progress_topic ON user_progress(topic_id);
```

#### Topics Table
```sql
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_tl VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  name_ceb VARCHAR(255),
  description TEXT,
  parent_topic_id UUID REFERENCES topics(id),
  subject_area VARCHAR(100),
  icon_name VARCHAR(50),
  display_order INTEGER,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_topics_parent ON topics(parent_topic_id);
```

#### Achievements Table
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_tl VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  description_tl TEXT,
  description_en TEXT,
  badge_icon_url TEXT,
  achievement_type VARCHAR(50),
  requirement_criteria JSONB,
  points_reward INTEGER DEFAULT 0,
  rarity_level VARCHAR(20)
);
```

#### User_Achievements Table
```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  achievement_id UUID REFERENCES achievements(id),
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  progress_percentage DECIMAL(5,2),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements ON user_achievements(user_id);
```

---

## 4. API Specification

### 4.1 Authentication Endpoints

#### POST /api/auth/register
```json
Request:
{
  "email": "juan@example.com",
  "username": "juandelacruz",
  "password": "SecurePass123!",
  "fullName": "Juan Dela Cruz",
  "preferredLanguage": "tl",
  "educationLevel": "high_school"
}

Response (201):
{
  "success": true,
  "data": {
    "userId": "uuid",
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

#### POST /api/auth/login
```json
Request:
{
  "email": "juan@example.com",
  "password": "SecurePass123!"
}

Response (200):
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "juandelacruz",
      "email": "juan@example.com",
      "preferredLanguage": "tl"
    },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### 4.2 Quiz Endpoints

#### POST /api/quiz/start
```json
Request:
{
  "topicId": "uuid",
  "questionCount": 20,
  "difficultyLevel": 3,
  "scoringAlgorithm": "confidence_based"
}

Response (200):
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "questions": [
      {
        "id": "uuid",
        "questionText": "Ano ang pangunahing layunin ng edukasyon?",
        "options": [
          {
            "id": "uuid",
            "text": "Pag-aaral ng mga libro"
          },
          {
            "id": "uuid",
            "text": "Paglinang ng kaalaman at kasanayan"
          }
        ],
        "mediaUrl": null,
        "points": 1
      }
    ]
  }
}
```

#### POST /api/quiz/submit-answer
```json
Request:
{
  "sessionId": "uuid",
  "questionId": "uuid",
  "selectedOptionId": "uuid",
  "confidenceLevel": 4,
  "timeSpent": 15
}

Response (200):
{
  "success": true,
  "data": {
    "isCorrect": true,
    "pointsEarned": 2.0,
    "explanation": "Tama! Ang edukasyon ay naglalayong...",
    "currentScore": 85.5,
    "questionsRemaining": 10
  }
}
```

#### POST /api/quiz/complete
```json
Request:
{
  "sessionId": "uuid"
}

Response (200):
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "finalScore": 85.5,
    "totalQuestions": 20,
    "correctAnswers": 17,
    "timeSpent": 420,
    "newAchievements": ["uuid"],
    "strengthAreas": ["Filipino Grammar", "History"],
    "weaknessAreas": ["Mathematics"],
    "recommendedTopics": ["uuid"]
  }
}
```

### 4.3 Analytics Endpoints

#### GET /api/analytics/user-progress
```json
Response (200):
{
  "success": true,
  "data": {
    "overallProgress": {
      "totalQuizzes": 45,
      "averageScore": 82.5,
      "totalTimeSpent": 12600,
      "currentStreak": 7
    },
    "topicProgress": [
      {
        "topicId": "uuid",
        "topicName": "Filipino Grammar",
        "accuracy": 88.5,
        "questionsAttempted": 150,
        "strengthScore": 92.0
      }
    ],
    "recentSessions": [],
    "performanceTrend": {
      "dates": ["2025-11-11", "2025-11-12"],
      "scores": [78.5, 82.3]
    }
  }
}
```

#### GET /api/analytics/topic-analysis/:topicId
```json
Response (200):
{
  "success": true,
  "data": {
    "topicId": "uuid",
    "topicName": "Kasaysayan ng Pilipinas",
    "difficultyDistribution": {
      "1": {"attempted": 10, "accuracy": 95},
      "2": {"attempted": 20, "accuracy": 85},
      "3": {"attempted": 15, "accuracy": 75}
    },
    "commonMistakes": [
      {
        "questionId": "uuid",
        "errorRate": 65,
        "questionPreview": "Kailan naganap ang..."
      }
    ],
    "timeAnalysis": {
      "averageTimePerQuestion": 18,
      "fastestCorrect": 8,
      "slowestCorrect": 45
    }
  }
}
```

### 4.4 Leaderboard Endpoints

#### GET /api/leaderboard/global
```json
Query Params: ?period=weekly&limit=50

Response (200):
{
  "success": true,
  "data": {
    "period": "weekly",
    "leaderboard": [
      {
        "rank": 1,
        "userId": "uuid",
        "username": "filipinomaster",
        "totalPoints": 15420,
        "quizzesTaken": 78,
        "averageScore": 91.5
      }
    ],
    "userRank": {
      "rank": 125,
      "totalPoints": 8540
    }
  }
}
```

---

## 5. Scoring Algorithms

### 5.1 Standard Scoring
```typescript
// Basic correct = +points, incorrect = 0
calculateScore(question: Question, answer: Answer): number {
  return answer.isCorrect ? question.points : 0;
}
```

### 5.2 Negative Penalty Scoring
```typescript
// Discourages guessing: incorrect = -percentage of points
calculateScore(question: Question, answer: Answer): number {
  if (answer.isCorrect) {
    return question.points;
  } else {
    return -(question.points * 0.25); // -25% penalty
  }
}
```

### 5.3 Partial Credit Scoring
```typescript
// Award partial points based on option configuration
calculateScore(question: Question, answer: Answer): number {
  if (answer.isCorrect) {
    return question.points;
  } else {
    const option = question.options.find(o => o.id === answer.optionId);
    return question.points * (option.partialCreditPercentage / 100);
  }
}
```

### 5.4 Confidence-Based Scoring
```typescript
// Double rewards/penalties for high confidence
calculateScore(
  question: Question, 
  answer: Answer, 
  confidence: number
): number {
  const baseScore = answer.isCorrect ? question.points : -question.points * 0.5;
  const multiplier = confidence >= 4 ? 2.0 : 1.0;
  return baseScore * multiplier;
}
```

### 5.5 Threshold Scoring
```typescript
// Scores below threshold default to 0%
calculateFinalScore(rawScore: number, maxScore: number, threshold: number): number {
  const percentage = (rawScore / maxScore) * 100;
  return percentage < threshold ? 0 : percentage;
}
```

---

## 6. Adaptive Difficulty System

### 6.1 Algorithm
```typescript
interface DifficultyAdjustment {
  currentDifficulty: number;
  recentAccuracy: number;
  responseTime: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
}

function adjustDifficulty(metrics: DifficultyAdjustment): number {
  let newDifficulty = metrics.currentDifficulty;
  
  // Increase difficulty if performing well
  if (metrics.recentAccuracy > 80 && metrics.consecutiveCorrect >= 3) {
    newDifficulty = Math.min(5, newDifficulty + 1);
  }
  
  // Decrease difficulty if struggling
  if (metrics.recentAccuracy < 50 && metrics.consecutiveIncorrect >= 3) {
    newDifficulty = Math.max(1, newDifficulty - 1);
  }
  
  // Consider response time (fast + correct = increase)
  if (metrics.responseTime < 10 && metrics.recentAccuracy > 85) {
    newDifficulty = Math.min(5, newDifficulty + 1);
  }
  
  return newDifficulty;
}
```

---

## 7. Gamification System

### 7.1 Achievement Types

#### Milestone Achievements
- **First Steps:** Complete first quiz
- **Persistent Learner:** 7-day streak
- **Knowledge Seeker:** 50 quizzes completed
- **Master Scholar:** 500 quizzes completed

#### Performance Achievements
- **Perfect Score:** 100% on any quiz
- **Speed Demon:** Complete quiz in under 5 minutes
- **Consistent Excellence:** 5 quizzes with 90%+ score
- **Comeback King:** Improve score by 30% in same topic

#### Topic Mastery
- **Filipino Grammar Master:** 95%+ accuracy in 20+ questions
- **History Buff:** Complete all history topics
- **Math Wizard:** Highest difficulty level in mathematics

#### Cultural Achievements
- **Multilingual:** Complete quizzes in 3+ languages
- **Cultural Explorer:** Answer 100+ cultural context questions

### 7.2 Points System
```typescript
interface PointsCalculation {
  basePoints: number;           // From question difficulty
  accuracyBonus: number;         // +50% if 100% accuracy
  speedBonus: number;            // +25% if fast completion
  streakMultiplier: number;      // 1.5x for 7+ day streak
  difficultyMultiplier: number;  // 1x to 2x based on level
}

function calculateTotalPoints(calc: PointsCalculation): number {
  return calc.basePoints * 
         (1 + calc.accuracyBonus + calc.speedBonus) * 
         calc.streakMultiplier * 
         calc.difficultyMultiplier;
}
```

---

## 8. Filipino Language Implementation

### 8.1 Language Structure
```typescript
interface MultilingualContent {
  tl: string;  // Tagalog (primary)
  en: string;  // English (fallback)
  ceb?: string; // Cebuano (optional)
  ilo?: string; // Ilocano (optional)
  hil?: string; // Hiligaynon (optional)
}

interface Question {
  questionText: MultilingualContent;
  options: Array<{
    text: MultilingualContent;
    isCorrect: boolean;
  }>;
  explanation: MultilingualContent;
  culturalContext?: string;
}
```

### 8.2 Cultural Context Integration
```typescript
// Example questions with cultural references
{
  questionText: {
    tl: "Ano ang tawag sa tradisyonal na sayaw sa Visayas na ginagawa tuwing pista?",
    en: "What is the traditional dance in Visayas performed during festivals?"
  },
  culturalContext: "Ang Sinulog ay isa sa pinakasikat na pista sa Pilipinas",
  options: [
    { text: { tl: "Tinikling", en: "Tinikling" }, isCorrect: false },
    { text: { tl: "Sinulog", en: "Sinulog" }, isCorrect: true }
  ]
}
```

---

## 9. Security Measures

### 9.1 Authentication Security
- **Password Requirements:** Minimum 8 characters, mixed case, numbers, symbols
- **JWT Expiration:** Access token (15 min), Refresh token (7 days)
- **Rate Limiting:** 5 login attempts per 15 minutes
- **Session Management:** Redis-based session tracking

### 9.2 Anti-Cheating Mechanisms
```typescript
interface CheatDetection {
  // Pattern Detection
  suspiciouslyFastAnswers: boolean;      // < 2 seconds consistently
  perfectScoreMultipleSessions: boolean; // 100% multiple times
  identicalAnswerPatterns: boolean;      // Same wrong answers as others
  
  // Behavioral Analysis
  abnormalResponseTimes: number[];       // Statistical outliers
  deviceFingerprint: string;             // Browser fingerprinting
  ipAddressHistory: string[];            // Multiple accounts detection
  
  // Real-time Monitoring
  tabSwitchCount: number;                // Minimize quiz, check answers
  copyPasteDetected: boolean;            // Clipboard monitoring
  screenCaptureAttempts: number;         // Screenshot detection
}
```

### 9.3 Data Protection
- **Encryption at Rest:** AES-256 for sensitive data
- **Encryption in Transit:** TLS 1.3
- **PII Handling:** GDPR-compliant data anonymization
- **Backup Encryption:** Automated encrypted backups

---

## 10. Performance Requirements

### 10.1 Response Time Targets
- **API Response:** < 200ms (p95)
- **Page Load:** < 2 seconds (initial)
- **Quiz Question Load:** < 100ms
- **Analytics Dashboard:** < 500ms

### 10.2 Scalability
- **Concurrent Users:** Support 10,000+ simultaneous users
- **Database Optimization:** Indexed queries, connection pooling
- **Caching Strategy:** Redis for hot data (leaderboards, sessions)
- **CDN:** Static assets served from edge locations

---

## 11. Accessibility Standards

### 11.1 WCAG 2.1 Level AA Compliance
- **Keyboard Navigation:** Full functionality without mouse
- **Screen Reader Support:** ARIA labels, semantic HTML
- **Color Contrast:** Minimum 4.5:1 ratio
- **Text Scaling:** Support up to 200% zoom
- **Alternative Text:** All images and media

### 11.2 Filipino Accessibility
- **Font Support:** Filipino diacritics (áéíóú, ñ)
- **Text-to-Speech:** Tagalog voice synthesis
- **Simplified Language:** Option for easier Tagalog

---

## 12. Deployment Architecture

### 12.1 Container Setup
```yaml
services:
  - frontend (React/Nginx)
  - backend (Node.js/Express)
  - database (PostgreSQL)
  - cache (Redis)
  - worker (Background jobs)
```

### 12.2 Environment Configuration
```
Development:  localhost, SQLite/PostgreSQL
Staging:      staging.domain.com, PostgreSQL, Redis
Production:   app.domain.com, PostgreSQL cluster, Redis cluster
```

### 12.3 CI/CD Pipeline
```
GitHub → Actions → Build → Test → Deploy
  ↓        ↓         ↓       ↓       ↓
 Push    Lint     Docker  Jest   AWS/Vercel
```

---

## 13. Monitoring & Analytics

### 13.1 Application Metrics
- **Error Rate:** < 0.1%
- **Uptime:** 99.9% SLA
- **Response Time:** P50, P95, P99 tracking
- **Active Users:** Real-time dashboard

### 13.2 Business Metrics
- **User Engagement:** Daily/Monthly active users
- **Quiz Completion Rate:** Target > 80%
- **Average Session Duration:** 15-20 minutes
- **Retention Rate:** 7-day, 30-day cohorts

---

## 14. Development Roadmap

### Phase 1: MVP (Weeks 1-4)
- User authentication
- Basic quiz functionality
- Standard scoring algorithm
- Simple analytics dashboard

### Phase 2: Core Features (Weeks 5-8)
- Multiple scoring algorithms
- Adaptive difficulty
- Progress tracking
- Filipino content integration

### Phase 3: Advanced Features (Weeks 9-12)
- Gamification system
- Multimedia support
- Offline mode
- Advanced analytics

### Phase 4: Polish & Launch (Weeks 13-16)
- Security hardening
- Performance optimization
- Localization complete
- Beta testing

---

## 15. Testing Strategy

### 15.1 Test Coverage
- **Unit Tests:** > 80% coverage
- **Integration Tests:** API endpoints
- **E2E Tests:** Critical user flows
- **Load Tests:** 10,000 concurrent users

### 15.2 Test Scenarios
```typescript
describe('Scoring Engine', () => {
  test('Standard scoring: correct answer', () => {
    expect(calculateScore(question, correctAnswer)).toBe(10);
  });
  
  test('Negative scoring: incorrect answer', () => {
    expect(calculateScore(question, wrongAnswer)).toBe(-2.5);
  });
  
  test('Confidence boost: high confidence correct', () => {
    expect(calculateScore(question, correctAnswer, 5)).toBe(20);
  });
});
```

---

## 16. Documentation Deliverables

### 16.1 Technical Documentation
- API Reference (OpenAPI/Swagger)
- Database Schema Documentation
- Architecture Decision Records (ADRs)
- Deployment Guides

### 16.2 User Documentation
- User Guide (Tagalog & English)
- FAQ Section
- Video Tutorials
- Teacher/Admin Guides

---

## 17. Maintenance Plan

### 17.1 Regular Maintenance
- **Daily:** Automated backups, log monitoring
- **Weekly:** Security patches, performance review
- **Monthly:** Database optimization, content updates
- **Quarterly:** Feature releases, major updates

### 17.2 Support Channels
- In-app chat support
- Email support (support@quizapp.ph)
- Community forum
- Documentation portal

---

## Appendix A: Technology Justifications

### Why PostgreSQL?
- Complex relational data (users, questions, sessions)
- JSONB support for flexible metadata
- Full-text search capabilities
- Mature ecosystem

### Why React + TypeScript?
- Component reusability
- Type safety reduces bugs
- Large ecosystem
- Excellent performance

### Why Express.js?
- Lightweight and flexible
- Large middleware ecosystem
- TypeScript support
- Easy to scale

---

## Appendix B: Cost Estimates

### Infrastructure (Monthly)
- **Hosting:** $50-100 (VPS/Cloud)
- **Database:** $30-50 (managed PostgreSQL)
- **CDN/Storage:** $20-30
- **Monitoring:** $10-20
- **Total:** $110-200/month

### Development (One-time)
- **Initial Development:** 12-16 weeks
- **Content Creation:** Ongoing
- **Maintenance:** 10-15 hours/week

---

**Document End**
