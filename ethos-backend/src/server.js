import express from 'express';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import usersRouter from './routes/users.js';
import postsRouter from './routes/posts.js';
import questsRouter from './routes/quests.js';
import boardsRoutes from './routes/boards.js'; 
import collabsRoutes from './routes/collabs.js'; 

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Route Groups
app.use('/api/auth', authRoutes);    // login, register, refresh, logout, me
app.use('/api/users', usersRouter);  // profile & quest/post aggregation
app.use('/api/posts', postsRouter);  // post creation
app.use('/api/quests', questsRouter); // quest management
app.use('/api/boards', boardsRoutes); 
app.use('/api/collabs', collabsRoutes); 

// Start Server
app.listen(3001, () => console.log('Backend running on http://localhost:3001'));