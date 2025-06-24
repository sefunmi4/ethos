// src/server.ts

import express, { Express } from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import type { Request, Response, NextFunction } from 'express';
import { requestLogger, info } from './utils/logger';

import authRoutes from './routes/authRoutes';
import gitRoutes from './routes/gitRoutes';
import postRoutes from './routes/postRoutes';
import questRoutes from './routes/questRoutes';
import boardRoutes from './routes/boardRoutes';
import reviewRoutes from './routes/reviewRoutes';
import userRoutes from './routes/userRoutes';
import notificationRoutes from './routes/notificationRoutes';

// Load environment variables from `.env` file
dotenv.config();

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
 * CORS configuration.
 * Enables cookies and cross-origin support for the client.
 */
function simpleCors(req: Request, res: Response, next: NextFunction): void {
  res.header('Access-Control-Allow-Origin', CLIENT_URL);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
}

/**
 * Middleware setup
 * @middleware CORS - enable cross-origin resource sharing
 * @middleware express.json - parse incoming JSON payloads
 * @middleware cookieParser - parse cookie headers
 */
app.use(simpleCors);
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
app.use('/api/boards', boardRoutes);  // 🧭 Boards and view layouts
app.use('/api/reviews', reviewRoutes); // ⭐ Reviews
app.use('/api/users', userRoutes);    // 👥 Public user profiles
app.use('/api/notifications', notificationRoutes); // 🔔 User notifications

/**
 * Default server port
 * @default 3001
 */
const PORT: number = parseInt(process.env.PORT || '3001', 10);

/**
 * Start the server
 * @function listen
 * Logs a message with the active port and frontend origin
 */
app.listen(PORT, () => {
  info(`🚀 Backend server running at http://localhost:${PORT}`);
  info(`🌐 Accepting requests from: ${CLIENT_URL}`);
});