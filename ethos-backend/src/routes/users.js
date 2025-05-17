import express from 'express';
import fs from 'fs';
import dotenv from 'dotenv';
import { authenticate } from '../middleware/authMiddleware.js';

dotenv.config();
const router = express.Router();
const USERS_FILE = './src/data/users.json';
const POSTS_FILE = './src/data/posts.json';
const QUESTS_FILE = './src/data/quests.json';

const loadUsers = () => JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '[]');
const loadPosts = () => JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8') || '[]');
const loadQuests = () => JSON.parse(fs.readFileSync(QUESTS_FILE, 'utf8') || '[]');

router.get('/:id/profile', authenticate, (req, res) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Access denied' });

  const users = loadUsers();
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const posts = loadPosts().filter(p => p.authorId === user.id);
  const quests = loadQuests()
    .filter(q => q.authorId === user.id)
    .map(q => ({
      ...q,
      logs: posts.filter(p => p.type === 'quest_log' && p.questId === q.id)
    }));
  const requests = posts.filter(p => p.type === 'request');

  res.json({
    id: user.id,
    username: user.username,
    bio: user.bio,
    tags: user.tags,
    links: user.links,
    quests,
    posts,
    requests
  });
});

router.put('/:id', authenticate, (req, res) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Access denied' });

  const users = loadUsers();
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { bio, tags, links } = req.body;
  if (bio) user.bio = bio;
  if (tags) user.tags = tags;
  if (links) user.links = links;

  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  res.json({ message: 'Profile updated', user });
});

export default router;