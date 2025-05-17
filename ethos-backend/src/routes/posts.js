import express from 'express';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const POSTS_FILE = './src/data/posts.json';

const loadPosts = () => {
  try {
    const data = fs.readFileSync(POSTS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch {
    return [];
  }
};
const savePosts = (posts) => fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));

router.post('/', (req, res) => {
  const { authorId, type, content, visibility, questId, tags } = req.body;
  if (!authorId || !type || !content) return res.status(400).json({ error: 'Missing fields' });
  if (type === 'quest_log' && !questId) return res.status(400).json({ error: 'Missing questId' });

  const newPost = {
    id: uuidv4(),
    authorId,
    type,
    content,
    visibility,
    questId: questId || null,
    tags: tags || [],
    timestamp: new Date().toISOString()
  };

  const posts = loadPosts();
  posts.push(newPost);
  savePosts(posts);
  res.status(201).json(newPost);
});

export default router;