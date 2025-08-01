// src/server.ts

import express, { Express } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { requestLogger, info } from './utils/logger';

import authRoutes from './routes/authRoutes';
import gitRoutes from './routes/gitRoutes';
import postRoutes from './routes/postRoutes';
import questRoutes from './routes/questRoutes';
import projectRoutes from './routes/projectRoutes';
import boardRoutes from './routes/boardRoutes';
import reviewRoutes from './routes/reviewRoutes';
import userRoutes from './routes/userRoutes';
import notificationRoutes from './routes/notificationRoutes';
import healthRoutes from './routes/healthRoutes';
import { initializeDatabase } from './db';

// Load environment variables from `.env` file
dotenv.config();
initializeDatabase().catch((err) =>
  console.error('[DB INIT ERROR]', err)
);

/**
 * Initialize the Express app.
 */
const app: Express = express();

/**
 * Define allowed frontend origin.
 * @constant
 * @default 'http://localhost:5173'
 */
const CLIENT_URL: string = process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * Comma separated list of allowed origins for CORS.
 * Allows multiple frontends in different environments.
 */
const ALLOWED_ORIGINS: string[] = (process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [CLIENT_URL]).map((o) => o.trim());


/**
 * Middleware setup
 * @middleware CORS - enable cross-origin resource sharing
 * @middleware express.json - parse incoming JSON payloads
 * @middleware cookieParser - parse cookie headers
 * @middleware helmet - basic security headers
 * @middleware rateLimit - basic rate limiting
 */

// Default set of allowed origins for CORS
const allowedOrigins = ALLOWED_ORIGINS;

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use((req: Request, res: Response, next: NextFunction) => {
  if (
    process.env.NODE_ENV === 'production' &&
    req.headers['x-forwarded-proto'] !== 'https'
  ) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});
app.use(helmet());
// Apply rate limiting only in production to prevent local development issues
if (process.env.NODE_ENV === 'production') {
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
    })
  );
}
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

/**
 * API Routes
 * All routes are mounted under /api/namespace
 */
app.use('/api/auth', authRoutes);     // 🔐 Authentication (login, register, session)
app.use('/api/git', gitRoutes);       // 🔁 Git sync, commits, diffs
app.use('/api/posts', postRoutes);    // 📝 Posts, reactions, replies
app.use('/api/quests', questRoutes);  // 📦 Quests, task maps
app.use('/api/projects', projectRoutes); // 🗂 Projects
app.use('/api/boards', boardRoutes);  // 🧭 Boards and view layouts
app.use('/api/reviews', reviewRoutes); // ⭐ Reviews
app.use('/api/users', userRoutes);    // 👥 Public user profiles
app.use('/api/notifications', notificationRoutes); // 🔔 User notifications
app.use('/api/health', healthRoutes); // ❤️ Health check

// Generic error handler to prevent leaking stack traces in production
app.use(
  (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    console.error(err);
    if (err.message === 'Not allowed by CORS') {
      res.status(403).json({ error: err.message });
      return;
    }
    if (process.env.NODE_ENV === 'production') {
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(500).json({ error: err.message, stack: err.stack });
    }
  }
);

/**
 * Default server port
 * @default 4173
 */
const PORT: number = parseInt(process.env.PORT || '4173', 10);

/**
 * Create HTTP and Socket.IO servers and start listening.
 */
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
  },
});

io.on('connection', (socket) => {
  info(`🔌 Socket connected: ${socket.id}`);
  socket.on('disconnect', (reason) => {
    info(`🔌 Socket disconnected: ${reason}`);
  });
});

httpServer.listen(PORT, () => {
  info(`🚀 Backend server running at http://localhost:${PORT}`);
  info(`🌐 Accepting requests from: ${ALLOWED_ORIGINS.join(', ')}`);
});
