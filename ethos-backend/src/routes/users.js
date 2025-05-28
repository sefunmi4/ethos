import express from 'express';
import dotenv from 'dotenv';
import authOptional from '../middleware/authOptional.js';
import { usersStore, postsStore, questsStore } from '../utils/loaders.js';

dotenv.config();
const router = express.Router();

router.get('/:id/profile', authOptional, (req, res) => {
  const { id } = req.params;
  const users = usersStore.read();
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const posts = postsStore.read();
  const quests = questsStore.read();
  const isOwner = req.user?.id === id;

  const visiblePosts = posts
    .filter(p => p.authorId === id && (isOwner || p.visibility === 'public'))
    .map(p => ({
      ...p,
      replies: posts.filter(r => r.replyTo === p.id),
      reposts: posts.filter(r => r.parentPostId === p.id)
    }))
  const visibleQuests = quests.filter(q => q.authorId === id && (isOwner || q.visibility === 'public'));

  const activeQuests = visibleQuests.map(q => ({
    id: q.id,
    title: q.title,
    summary: q.description || '',
    status: q.status,
    tags: q.tags || [],
    collaborators: q.collaborators || []
  }));

  res.json({
    id: user.id,
    username: user.username || `user_${user.id.slice(-5)}`,
    bio: user.bio || '',
    tags: user.tags || [],
    links: user.links || {},
    posts: visiblePosts,
    quests: activeQuests,
    requests: visiblePosts.filter(p => p.type === 'request')
  });
});

export default router;
