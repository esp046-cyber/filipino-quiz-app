# Filipino Adaptive Quiz Application

<div align="center">

![Filipino Quiz](https://via.placeholder.com/800x200/4CAF50/FFFFFF?text=Filipino+Adaptive+Quiz+Application)

**A comprehensive educational platform featuring adaptive scoring, multilingual support (Tagalog, Cebuano, and other Philippine languages), and advanced analytics for Filipino learners.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-316192)](https://www.postgresql.org/)

</div>

---

## 📚 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Scoring Algorithms](#scoring-algorithms)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

The Filipino Adaptive Quiz Application is a cutting-edge educational platform designed specifically for Filipino learners. It implements intelligent adaptive difficulty adjustment, multiple scoring strategies, and comprehensive progress tracking to optimize learning outcomes.

### Why This Application?

- **Culturally Relevant:** Questions incorporate Filipino cultural context, history, and values
- **Adaptive Learning:** Difficulty adjusts based on user performance in real-time
- **Multilingual Support:** Full support for Tagalog, Cebuano, Ilocano, and Hiligaynon
- **Advanced Analytics:** Detailed performance tracking and weakness identification
- **Gamification:** Achievements, streaks, and leaderboards to enhance engagement

---

## ✨ Key Features

### 1. Adaptive Scoring System

The application implements **8 different scoring strategies** using the Strategy Pattern:

| Strategy | Description | Use Case |
|----------|-------------|----------|
| **Standard Scoring** | Simple correct/incorrect | Basic quizzes |
| **Negative Penalty** | -25% penalty for wrong answers | Discourage guessing |
| **Partial Credit** | Award percentage of points | Semi-correct answers |
| **Confidence-Based** | Double points/penalties for high confidence | Encourage self-awareness |
| **Threshold Scoring** | Minimum score requirement | Pass/fail scenarios |
| **Time-Based** | Bonus for fast correct answers | Speed challenges |
| **Adaptive Difficulty** | Points scale with difficulty | Fair progression |
| **Combo/Streak** | Bonus for consecutive correct | Sustained performance |

### 2. Multilingual Support

```typescript
// Example question structure
{
  questionText: {
    tl: "Ano ang pangunahing layunin ng edukasyon?",
    en: "What is the main purpose of education?",
    ceb: "Unsa ang nag-unang katuyoan sa edukasyon?"
  }
}
```

### 3. Progress Tracking & Analytics

- **Real-time Performance Monitoring:** WebSocket-based live score updates
- **Topic Mastery Analysis:** Identify strengths and weaknesses by subject
- **Performance Trends:** Visualize improvement over time
- **Predictive Recommendations:** Suggest optimal difficulty levels

### 4. Gamification Elements

- **Achievements System:** 50+ badges for various milestones
- **Streak Tracking:** Daily activity monitoring
- **Leaderboards:** Global and topic-specific rankings
- **Experience Points:** Level up system with rewards

### 5. Anti-Cheating Mechanisms

```typescript
interface CheatDetection {
  suspiciouslyFastAnswers: boolean;
  tabSwitchCount: number;
  copyPasteDetected: boolean;
  screenCaptureAttempts: number;
  identicalAnswerPatterns: boolean;
}
```

---

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────┐
│          CLIENT APPLICATIONS                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Desktop  │  │  Mobile  │  │  Tablet  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
└───────┼─────────────┼──────────────┼───────┘
        │             │              │
        └─────────────┼──────────────┘
                      │
            ┌─────────▼─────────┐
            │   CDN / Nginx     │
            │  (Load Balancer)  │
            └─────────┬─────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
  ┌─────▼──────┐┌────▼─────┐┌─────▼──────┐
  │  Express   ││ Express  ││ WebSocket  │
  │  API (1)   ││ API (2)  ││   Server   │
  └─────┬──────┘└────┬─────┘└─────┬──────┘
        │            │            │
        └────────────┼────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
  ┌─────▼──────┐┌───▼─────┐┌────▼──────┐
  │PostgreSQL  ││  Redis  ││    S3     │
  │  Database  ││  Cache  ││  Storage  │
  └────────────┘└─────────┘└───────────┘
```

### Technology Stack

**Frontend:**
- React 18.2 with TypeScript
- Material-UI (MUI) v5 for components
- Redux Toolkit for state management
- Recharts for analytics visualization
- Socket.io-client for real-time updates
- Vite as build tool
- Workbox for PWA/offline support

**Backend:**
- Node.js 20.x LTS
- Express.js 4.x with TypeScript
- Prisma ORM for database access
- JWT authentication with bcrypt
- Socket.io for WebSocket
- Winston for logging
- Zod for validation
- Jest for testing

**Database & Caching:**
- PostgreSQL 15.x (primary database)
- Redis 7.x (session management, caching)
- Full-text search capabilities

**DevOps:**
- Docker & Docker Compose
- Nginx (reverse proxy)
- GitHub Actions (CI/CD)

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.0.0
- PostgreSQL >= 15.0
- Redis >= 7.0
- Docker (optional, for containerized deployment)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/filipino-quiz-app.git
cd filipino-quiz-app
```

#### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run database migrations
npm run migrate

# Seed initial data
npm run seed

# Start development server
npm run dev
```

#### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:5000/api" > .env.local
echo "VITE_WS_URL=ws://localhost:5000" >> .env.local

# Start development server
npm run dev
```

#### 4. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/health

### Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up -d --build
```

---

## 🎯 Scoring Algorithms

### Example: Confidence-Based Scoring

```typescript
// High confidence correct answer: 2x points
const result = calculateScore({
  question: { id: '1', points: 10, difficultyLevel: 3 },
  answer: { 
    questionId: '1', 
    selectedOptionId: 'opt1', 
    isCorrect: true,
    confidenceLevel: 5  // Very confident
  }
});
// Result: +20 points

// High confidence incorrect answer: 2x penalty
const result = calculateScore({
  question: { id: '1', points: 10, difficultyLevel: 3 },
  answer: { 
    questionId: '1', 
    selectedOptionId: 'opt2', 
    isCorrect: false,
    confidenceLevel: 5  // Very confident but wrong
  }
});
// Result: -5 points (double penalty)
```

### Adaptive Difficulty Algorithm

```typescript
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
  
  return newDifficulty;
}
```

---

## 📖 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "juan@example.com",
  "username": "juandelacruz",
  "password": "SecurePass123!",
  "fullName": "Juan Dela Cruz",
  "preferredLanguage": "tl"
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

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "SecurePass123!"
}
```

### Quiz Endpoints

#### Start Quiz
```http
POST /api/quiz/start
Authorization: Bearer {token}
Content-Type: application/json

{
  "topicId": "uuid",
  "questionCount": 20,
  "difficultyLevel": 3,
  "scoringAlgorithm": "confidence_based"
}
```

#### Submit Answer
```http
POST /api/quiz/submit-answer
Authorization: Bearer {token}
Content-Type: application/json

{
  "sessionId": "uuid",
  "questionId": "uuid",
  "selectedOptionId": "uuid",
  "confidenceLevel": 4,
  "timeSpent": 15
}
```

#### Complete Quiz
```http
POST /api/quiz/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "sessionId": "uuid"
}
```

### Analytics Endpoints

#### Get User Progress
```http
GET /api/analytics/user-progress
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "overallProgress": {
      "totalQuizzes": 45,
      "averageScore": 82.5,
      "currentStreak": 7
    },
    "topicProgress": [...],
    "performanceTrend": {...}
  }
}
```

For complete API documentation, see: [API_REFERENCE.md](docs/API_REFERENCE.md)

---

## 🗄️ Database Schema

### Key Tables

**Users Table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  preferred_language VARCHAR(10) DEFAULT 'tl',
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Questions Table:**
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY,
  question_text_tl TEXT NOT NULL,
  question_text_en TEXT NOT NULL,
  topic_id UUID REFERENCES topics(id),
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  points INTEGER DEFAULT 1,
  cultural_context TEXT,
  correct_rate DECIMAL(5,2) GENERATED ALWAYS AS (...)
);
```

**Quiz Sessions Table:**
```sql
CREATE TABLE quiz_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  topic_id UUID REFERENCES topics(id),
  total_questions INTEGER NOT NULL,
  raw_score DECIMAL(8,2),
  percentage_score DECIMAL(5,2),
  scoring_algorithm VARCHAR(50),
  completed_at TIMESTAMP
);
```

For complete schema, see: [database/schema.sql](database/schema.sql)

---

## 🚀 Deployment

### Production Deployment Checklist

- [ ] Set strong JWT_SECRET in environment variables
- [ ] Configure PostgreSQL with SSL/TLS
- [ ] Set up Redis password authentication
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure rate limiting and DDoS protection
- [ ] Set up automated database backups
- [ ] Configure monitoring (Prometheus + Grafana)
- [ ] Set up error tracking (Sentry)
- [ ] Enable CORS with specific origins only
- [ ] Configure CSP headers
- [ ] Set up log rotation
- [ ] Configure CDN for static assets

### Environment-Specific Configuration

**Development:**
```bash
NODE_ENV=development
LOG_LEVEL=debug
```

**Staging:**
```bash
NODE_ENV=staging
LOG_LEVEL=info
```

**Production:**
```bash
NODE_ENV=production
LOG_LEVEL=warn
```

---

## 💻 Development

### Project Structure

```
filipino-quiz-app/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   ├── strategies/      # Scoring strategies
│   │   ├── utils/           # Utility functions
│   │   └── server.ts        # Entry point
│   ├── tests/               # Test files
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom hooks
│   │   ├── store/           # Redux store
│   │   └── App.tsx          # Main app
│   ├── public/              # Static assets
│   └── package.json
├── database/
│   ├── schema.sql           # Database schema
│   └── migrations/          # DB migrations
├── docs/
│   ├── TECHNICAL_SPECIFICATION.md
│   └── API_REFERENCE.md
├── docker-compose.yml
└── README.md
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Run tests with coverage
npm test -- --coverage

# Frontend tests
cd frontend
npm test
```

### Code Quality

```bash
# Linting
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npx tsc --noEmit
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

- Follow TypeScript best practices
- Write comprehensive tests (>80% coverage)
- Use meaningful variable and function names
- Document complex logic with comments
- Follow the existing code style

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **MiniMax Agent** - *Initial work and architecture*

---

## 🙏 Acknowledgments

- Filipino educators and content creators
- Open-source community
- All contributors and testers

---

## 📞 Support

For support, email support@filipinoquiz.com or open an issue in the GitHub repository.

---

<div align="center">

**Made with ❤️ for Filipino learners**

[Documentation](docs/) • [API Reference](docs/API_REFERENCE.md) • [Report Bug](https://github.com/yourusername/filipino-quiz-app/issues) • [Request Feature](https://github.com/yourusername/filipino-quiz-app/issues)

</div>
