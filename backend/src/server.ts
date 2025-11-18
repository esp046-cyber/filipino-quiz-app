/**
 * Main Server Entry Point
 * Filipino Adaptive Quiz Application
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/authRoutes';
import quizRoutes from './routes/quizRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import userRoutes from './routes/userRoutes';
import leaderboardRoutes from './routes/leaderboardRoutes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// ============================================================================
// APPLICATION SETUP
// ============================================================================

const app: Application = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Masyadong maraming kahilingan. Subukan ulit mamaya. / Too many requests, please try again later.'
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }));
}

// ============================================================================
// ROUTES
// ============================================================================

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Filipino Adaptive Quiz API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      auth: '/api/auth',
      quiz: '/api/quiz',
      analytics: '/api/analytics',
      user: '/api/user',
      leaderboard: '/api/leaderboard'
    }
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Hindi mahanap ang endpoint / Endpoint not found',
    path: req.path
  });
});

// Error handling middleware
app.use(errorHandler);

// ============================================================================
// WEBSOCKET CONFIGURATION
// ============================================================================

io.on('connection', (socket) => {
  logger.info(`WebSocket client connected: ${socket.id}`);

  // Join user-specific room
  socket.on('join-room', (userId: string) => {
    socket.join(`user:${userId}`);
    logger.info(`User ${userId} joined their room`);
  });

  // Real-time quiz progress updates
  socket.on('quiz-answer-submitted', (data) => {
    const { userId, sessionId, score } = data;
    io.to(`user:${userId}`).emit('score-updated', {
      sessionId,
      currentScore: score,
      timestamp: new Date().toISOString()
    });
  });

  // Leaderboard updates
  socket.on('request-leaderboard-update', (period: string) => {
    // Emit updated leaderboard (would fetch from cache/DB)
    socket.emit('leaderboard-updated', {
      period,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    logger.info(`WebSocket client disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// ============================================================================
// SERVER STARTUP
// ============================================================================

const startServer = async () => {
  try {
    // Database connection check (would initialize Prisma here)
    logger.info('Checking database connection...');
    
    // Start server
    httpServer.listen(PORT, () => {
      logger.info(`
        ╔═══════════════════════════════════════════════════════════╗
        ║  Filipino Adaptive Quiz API Server                        ║
        ║                                                           ║
        ║  Environment: ${NODE_ENV.padEnd(42)} ║
        ║  Port: ${PORT.toString().padEnd(50)} ║
        ║  URL: http://localhost:${PORT}${' '.repeat(34)} ║
        ║                                                           ║
        ║  Status: ✓ Running                                       ║
        ╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Start the server
startServer();

export { app, io };
