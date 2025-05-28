import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import authMiddleware from '../middleware/authMiddleware.js';
import { postsStore, boardsStore, usersStore } from '../utils/loaders.js';
import { enrichPost, enrichPosts } from '../utils/enrich.js';


const router = express.Router();

// Create a new post
router.post('/', authMiddleware, (req, res) => {
  const { type, content, visibility, questId, tags, collaborators = [], boardId } = req.body;
  const authorId = req.user?.id;

  if (!authorId || !type || !content) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const newPost = {
    id: uuidv4(),
    authorId,
    type,
    content,
    visibility,
    questId: questId || null,
    tags: tags || [],
    collaborators: type === 'quest_log' ? collaborators : [],
    timestamp: new Date().toISOString(),
  };

  try {
    const posts = postsStore.read();
    const isDuplicate = posts.find(
      p =>
        p.authorId === authorId &&
        p.content === content &&
        Math.abs(new Date(p.timestamp) - new Date()) < 2000
    );
    if (isDuplicate) {
      console.warn('[SERVER] Duplicate post blocked:', content);
      return res.status(409).json({ error: 'Duplicate post detected' });
    }
    posts.push(newPost);
    postsStore.write(posts);

    // Attach post to board if specified
    if (boardId) {
      const boards = boardsStore.read();
      const board = boards.find(b => b.id === boardId || b.defaultFor === boardId);
      if (board) {
        board.items = [newPost.id, ...(board.items || [])];
        boardsStore.write(boards);
      } else {
        console.warn('[POST] Board not found for ID:', boardId);
      }
    }

    const users = usersStore.read();
    res.status(201).json(enrichPost(newPost, { users, currentUserId: authorId }));
  } catch (err) {
    console.error('Error saving post:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reply to a post
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
    replyTo: parent.id,
  };

  posts.push(reply);
  postsStore.write(posts);
  const users = usersStore.read();
  res.status(201).json(enrichPost(reply, { users, currentUserId: authorId }));
});

// Repost an existing post
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
    content: content || original.content,
    questId: questId || null,
    parentPostId: parentPostId || null,
    linkType: linkType || 'repost',
    timestamp: new Date().toISOString(),
    replyTo: null,
  };

  posts.push(repost);
  postsStore.write(posts);
  const users = usersStore.read();
  res.status(201).json(enrichPost(repost, { users, currentUserId: authorId }));
});

// Get all posts
router.get('/', (req, res) => {
  try {
    const posts = postsStore.read();
    const users = usersStore.read();
    const currentUserId = req.user?.id || null;
    const enriched = enrichPosts(posts, users, currentUserId);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load posts' });
  }
});

// Edit a post
router.put('/:id', authMiddleware, (req, res) => {
  const posts = postsStore.read();
  const postIndex = posts.findIndex(p => p.id === req.params.id.trim());
  if (postIndex === -1)
    return res.status(404).json({ error: 'Post not found' });

  const post = posts[postIndex];
  const userId = req.user.id;
  const isOwner = userId === post.authorId;
  const isCollaborator = post.type === 'quest_log' && post.collaborators?.includes(userId);
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
  const users = usersStore.read();
  res.json(enrichPost(post, { users, currentUserId: userId }));
});

// Delete a post
router.delete('/:id', authMiddleware, (req, res) => {
  const posts = postsStore.read();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const userId = req.user.id;
  const isOwner = userId === post.authorId;
  const isCollaborator = post.type === 'quest_log' && post.collaborators?.includes(userId);
  if (!isOwner && !isCollaborator)
    return res.status(403).json({ error: 'Not authorized' });

  const updated = posts.filter(p => p.id !== req.params.id);
  postsStore.write(updated);
  res.json({ message: 'Post deleted' });
});

export default router;