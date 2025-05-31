// server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import usersRouter from './routes/users.js';
import postsRouter from './routes/posts.js';
import questsRouter from './routes/quests.js';
import projectsRoutes from './routes/projects.js'; 
import boardsRoutes from './routes/boards.js'; 
import collabsRoutes from './routes/collabs.js'; 

dotenv.config();

const app = express();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
  sameSite: 'Lax',
}));
app.use(express.json());
app.use(cookieParser());

// ✅ Routes
app.use('/api/auth', authRoutes);    
app.use('/api/users', usersRouter);  
app.use('/api/posts', postsRouter);  
app.use('/api/quests', questsRouter); 
app.use('/api/projects', projectsRoutes); 
app.use('/api/boards', boardsRoutes); 
app.use('/api/collabs', collabsRoutes); 

// ✅ Start server
app.listen(3001, () => {
  console.log(`Backend running on http://localhost:3001 and accepting CORS from ${process.env.CLIENT_URL}`);
});