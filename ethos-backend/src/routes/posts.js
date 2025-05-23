import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import authMiddleware from '../middleware/authMiddleware.js';
import { postsStore } from '../utils/loaders.js';

const router = express.Router();

router.post('/', authMiddleware, (req, res) => {
  const { type, content, visibility, questId, tags, collaborators = [] } = req.body;
  const authorId = req.user?.id;

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
    const posts = postsStore.read();
    posts.push(newPost);
    postsStore.write(posts);
    res.status(201).json(newPost);
  } catch (err) {
    console.error('Error saving post:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/replies', authMiddleware, (req, res) => {
  const posts = postsStore.read();
  const { id } = req.params;
  const parent = posts.find(p => p.id === id);
  if (!parent) return res.status(404).json({ error: 'Post not found' });

  const { content } = req.body;
  const authorId = req.user?.id;
  if (!content || !authorId)
    return res.status(400).json({ error: 'Missing content or author' });

  const reply = {
    id: uuidv4(),
    type: 'free_speech',
    content,
    visibility: 'public',
    tags: ['reply'],
    authorId,
    questId: parent.questId || null,
    timestamp: new Date().toISOString(),
    replyTo: parent.id
  };

  posts.push(reply);
  postsStore.write(posts);
  res.status(201).json(reply);
});

router.post('/:id/repost', authMiddleware, (req, res) => {
  const posts = postsStore.read();
  const { id } = req.params;
  const original = posts.find(p => p.id === id);

  if (!original) return res.status(404).json({ error: 'Original post not found' });

  const { content, questId, parentPostId, linkType } = req.body;
  const authorId = req.user?.id;

  const repost = {
    ...original,
    id: uuidv4(),
    authorId,
    type: original.type,
    content: content || original.content,
    questId: questId || null,
    parentPostId: parentPostId || null,
    linkType: linkType || 'repost',
    timestamp: new Date().toISOString(),
    replyTo: null
  };

  posts.push(repost);
  postsStore.write(posts);

  res.status(201).json(repost);
});

router.get('/', (req, res) => {
  try {
    const posts = postsStore.read();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load posts' });
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  const posts = postsStore.read();
  const postIndex = posts.findIndex(p => p.id === req.params.id.trim());
  if (postIndex === -1)
    return res.status(404).json({ error: 'Post not found' });

  const post = posts[postIndex];
  const isOwner = req.user.id === post.authorId;
  const isCollaborator = post.type === 'quest_log' && post.collaborators?.includes(req.user.id);
  if (!isOwner && !isCollaborator)
    return res.status(403).json({ error: 'Not authorized' });

  const { content, visibility, tags, type, questId } = req.body;
  if (content) post.content = content;
  if (visibility) post.visibility = visibility;
  if (tags) post.tags = tags;
  if (type) post.type = type;
  post.questId = questId ?? null;

  posts[postIndex] = post;
  postsStore.write(posts);
  res.json(post);
});

router.delete('/:id', authMiddleware, (req, res) => {
  const posts = postsStore.read();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const isOwner = req.user.id === post.authorId;
  const isCollaborator = post.type === 'quest_log' && post.collaborators?.includes(req.user.id);
  if (!isOwner && !isCollaborator)
    return res.status(403).json({ error: 'Not authorized' });

  const updated = posts.filter(p => p.id !== req.params.id);
  postsStore.write(updated);
  res.json({ message: 'Post deleted' });
});

export default router;
