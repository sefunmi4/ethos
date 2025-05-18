import express from 'express';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import authMiddleware from '../middleware/authMiddleware.js';


const router = express.Router();
const POSTS_FILE = './src/data/posts.json';

const loadPosts = () => {
  try {
    const data = fs.readFileSync(POSTS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error loading posts:', err);
    return [];
  }
};

const savePosts = (posts) => fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));

router.post('/', authMiddleware, (req, res) => {
  const { type, content, visibility, questId, tags } = req.body;
  const authorId = req.user?.id; // <-- pull from decoded token
  const { collaborators = [] } = req.body;

  if (!authorId || !type || !content)
    return res.status(400).json({ error: 'Missing fields' });
  if (type === 'quest_log' && !questId)
    return res.status(400).json({ error: 'Missing questId' });

  const newPost = {
    id: uuidv4(),
    authorId,
    type,
    content,
    visibility,
    questId: questId || null,
    tags: tags || [],
    collaborators: type === 'quest_log' ? collaborators : [],
    timestamp: new Date().toISOString()
  };

  try {
    const posts = loadPosts();
    posts.push(newPost);
    console.log('Creating post for user:', authorId);
    console.log('Request body:', req.body);
    savePosts(posts);
    res.status(201).json(newPost);
  } catch (err) {
    console.error('Error saving post:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', (req, res) => {
  try {
    const posts = loadPosts();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load posts' });
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  const posts = loadPosts();
  const postIndex = posts.findIndex(p => p.id === req.params.id.trim());
  if (postIndex === -1) {
    console.error('Post not found for update:', req.params.id);
    return res.status(404).json({ error: 'Post not found' });
  }

  console.log('Received PUT request for post ID:', req.params.id);
  console.log('Available post IDs:', posts.map(p => p.id));



  const post = posts[postIndex];

  // Ownership or collaboration check
  const isOwner = req.user.id === post.authorId;
  const isCollaborator = post.type === 'quest_log' && post.collaborators?.includes(req.user.id);
  console.log('AUTH CHECK:', req.user.id, 'vs', post.authorId);

  if (!isOwner && !isCollaborator) {
    console.warn('Authorization failed for post update:', {
      currentUser: req.user.id,
      postAuthor: post.authorId,
      collaborators: post.collaborators,
      postType: post.type
    });
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { content, visibility, tags, type, questId } = req.body;
  if (content) post.content = content;
  if (visibility) post.visibility = visibility;
  if (tags) post.tags = tags;
  if (type) post.type = type;
  post.questId = questId ?? null;

  

  console.log('Updated post:', post);
  posts[postIndex] = post;
  savePosts(posts);

  res.json(post);
});

router.delete('/:id', authMiddleware, (req, res) => {
  const posts = loadPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const isOwner = req.user.id === post.authorId;
  const isCollaborator = post.type === 'quest_log' && post.collaborators?.includes(req.user.id);

  if (!isOwner && !isCollaborator) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const updated = posts.filter(p => p.id !== req.params.id);
  savePosts(updated);
  res.json({ message: 'Post deleted' });
});

export default router;