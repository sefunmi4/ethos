import express from 'express';
import fs from 'fs';
import dotenv from 'dotenv';
import authOptional from '../middleware/authOptional.js';

dotenv.config();
const router = express.Router();
const USERS_FILE = './src/data/users.json';
const POSTS_FILE = './src/data/posts.json';
const QUESTS_FILE = './src/data/quests.json';

const loadUsers = () => JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '[]');
const loadPosts = () => JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8') || '[]');
const loadQuests = () => JSON.parse(fs.readFileSync(QUESTS_FILE, 'utf8') || '[]');


router.get('/:id/profile', authOptional, (req, res) => {
  const { id } = req.params;
  const users = loadUsers();
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const posts = loadPosts();
  const quests = loadQuests();

  const isOwner = req.user?.id === id;

  res.json({
    id: user.id,
    username: user.username || `user_${user.id.slice(-5)}`,
    bio: user.bio || '',
    tags: user.tags || [],
    links: user.links || {},
    posts: posts.filter(p =>
      p.authorId === id && (isOwner || p.visibility === 'public')
    ),
    quests: quests.filter(q =>
      q.authorId === id && (isOwner || q.visibility === 'public')
    ),
    requests: posts.filter(p =>
      p.type === 'request' && p.authorId === id && (isOwner || p.visibility === 'public')
    )
  });
});


export default router;