import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import authMiddleware from '../middleware/authMiddleware.js';
import { postsStore, boardsStore, usersStore, reactionsStore } from '../utils/loaders.js';
import { enrichPost, enrichPosts } from '../utils/enrich.js';


const router = express.Router();

// Create a new post
// ✅ Create a new post
router.post('/', authMiddleware, (req, res) => {
  const {
    type,
    content,
    visibility,
    questId,
    tags,
    collaborators = [],
    boardId,
    repostedFrom,
    linkedItems = [],
    replyTo = null,
  } = req.body;
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
    replyTo, // ✅ ENSURE THIS LINE EXISTS
    timestamp: new Date().toISOString(),
    repostedFrom: repostedFrom || null,
    linkedItems: Array.isArray(linkedItems) ? linkedItems : [],
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

// POST /posts/:originalPostId/repost-toggle
router.post('/:originalPostId/repost-toggle', authMiddleware, (req, res) => {
  const posts = postsStore.read();
  const userId = req.user?.id;
  const originalId = req.params.originalPostId;

  // Check if repost already exists
  const existing = posts.find(
    p => p.repostedFrom?.originalPostId === originalId && p.authorId === userId
  );

  if (existing) {
    // Delete repost
    const updated = posts.filter(p => p.id !== existing.id);
    postsStore.write(updated);
    return res.status(200).json({ message: 'Repost removed', deletedId: existing.id });
  }

  // Else create repost
  const original = posts.find(p => p.id === originalId);
  if (!original || original.visibility === 'private') {
    return res.status(404).json({ error: 'Original post not available' });
  }

  const newRepost = {
    id: uuidv4(),
    authorId: userId,
    type: 'repost',
    content: original.content,
    visibility: 'public',
    repostedFrom: {
      id: original.id,
      username: original.author?.username || 'unknown',
      originalPostId: original.id,
    },
    timestamp: new Date().toISOString(),
  };

  posts.push(newRepost);
  postsStore.write(posts);
  return res.status(201).json(newRepost);
});

// GET number of reposts for a given post
router.get('/:id/repostCount', (req, res) => {
  try {
    const { id: originalPostId } = req.params;
    const posts = postsStore.read();

    const count = posts.filter(
      p => p.type === 'repost' && p.repostedFrom?.originalPostId === originalPostId
    ).length;

    res.json({ count });
  } catch (err) {
    console.error('[GET /posts/:id/repostCount] Failed:', err);
    res.status(500).json({ error: 'Failed to get repost count' });
  }
});

// GET /posts/:id/userRepost
router.get('/:id/userRepost', authMiddleware, (req, res) => {
  const postId = req.params.id;
  const userId = req.user?.id;

  const posts = postsStore.read();
  const repost = posts.find(p =>
    p.type === 'repost' &&
    p.repostedFrom?.id === postId &&
    p.authorId === userId
  );

  if (repost) {
    return res.json({ id: repost.id });
  } else {
    return res.json({ id: null });
  }
});

router.get('/:id', (req, res) => {
  const posts = postsStore.read();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});


// Reply to a post
router.post('/:id/replies', authMiddleware, (req, res) => {
  const posts = postsStore.read();
  const parent = posts.find(p => p.id === req.params.id);
  if (!parent) return res.status(404).json({ error: 'Post not found' });

  const {
    content,
    type = 'free_speech',
    linkedItems = [],
    questId,
    nodeId,
    repostedFrom
  } = req.body;

  const authorId = req.user?.id;
  if (!content || !authorId) return res.status(400).json({ error: 'Missing content or author' });

  const reply = {
    id: uuidv4(),
    type,
    content,
    visibility: 'public',
    tags: ['reply'],
    authorId,
    questId: questId || parent.questId || null,
    nodeId: nodeId || null,
    linkedItems: linkedItems.length
      ? linkedItems
      : parent.linkedItems?.length
        ? parent.linkedItems
        : parent.questId
          ? [{ type: 'quest', id: parent.questId, nodeId: null }]
          : [],
    repostedFrom: repostedFrom || null,
    timestamp: new Date().toISOString(),
    replyTo: parent.id, // ✅ CRITICAL FOR THREADING
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

  const {
    content,
    questId,
    parentPostId,
    linkType,
    repostedFrom,
    linkedItems = [],
  } = req.body;
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
    repostedFrom: repostedFrom || {
      id: original.authorId,
      username: original.username || 'unknown',
      originalPostId: original.id,
    },
    linkedItems: Array.isArray(linkedItems) ? linkedItems : [],
  };

  posts.push(repost);
  postsStore.write(posts);
  const users = usersStore.read();
  res.status(201).json(enrichPost(repost, { users, currentUserId: authorId }));
});

// GET a specific post by ID
router.get('/', (req, res) => {
  try {
    const posts = postsStore.read();
    const users = usersStore.read();
    const currentUserId = req.user?.id || null;

    const topLevelPosts = posts.filter(p => !p.replyTo); // Only show top-level posts

    const enriched = topLevelPosts.map(post => {
      const enrichedPost = enrichPost(post, { users, currentUserId });
      const replies = posts
        .filter(r => r.replyTo === post.id)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      enrichedPost.replyCount = replies.length;
      enrichedPost.replies = enrichPosts(replies.slice(0, 3), users, currentUserId); // Preview
      return enrichedPost;
    });

    res.json(enriched);
  } catch (err) {
    console.error('[GET /posts] Failed:', err);
    res.status(500).json({ error: 'Failed to load posts' });
  }
});

// GET paginated replies for a post
router.get('/:id/replies', (req, res) => {
  try {
    const posts = postsStore.read();
    const users = usersStore.read();
    const currentUserId = req.user?.id || null;
    const { id } = req.params;
    const offset = parseInt(req.query.offset || '0', 10);
    const limit = parseInt(req.query.limit || '10', 10);

    const allReplies = posts
      .filter(p => p.replyTo === id)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const paginated = allReplies.slice(offset, offset + limit);
    const enrichedReplies = enrichPosts(paginated, users, currentUserId);

    res.json({
      replies: enrichedReplies,
      total: allReplies.length,
      offset,
      limit
    });
  } catch (err) {
    console.error('[GET /posts/:id/replies] Failed:', err);
    res.status(500).json({ error: 'Failed to load replies' });
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

  const {
    content,
    visibility,
    tags,
    type,
    questId,
    repostedFrom,
    linkedItems,
  } = req.body;

  if (content) post.content = content;
  if (visibility) post.visibility = visibility;
  if (tags) post.tags = tags;
  if (type) post.type = type;
  if (questId !== undefined) post.questId = questId;
  if (repostedFrom !== undefined) post.repostedFrom = repostedFrom;
  if (linkedItems !== undefined) post.linkedItems = Array.isArray(linkedItems) ? linkedItems : [];

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

// Get all reactions for a post
router.get('/:id/reactions', authMiddleware, (req, res) => {
  const { id: postId } = req.params;
  const allReactions = reactionsStore.read();
  const postReactions = allReactions.filter(r => r.postId === postId);
  res.json(postReactions);
});

// Post a reaction
router.post('/:id/reactions', authMiddleware, (req, res) => {
  const { id: postId } = req.params;
  const userId = req.user?.id;
  const { type, active } = req.body;

  if (!userId || !type) return res.status(400).json({ error: 'Missing userId or type' });

  const allReactions = reactionsStore.read();
  const index = allReactions.findIndex(r => r.postId === postId && r.userId === userId && r.type === type);

  if (index !== -1) {
    if (!active) {
      allReactions.splice(index, 1);
    } else {
      allReactions[index].timestamp = new Date().toISOString();
    }
  } else if (active) {
    allReactions.push({
      postId,
      userId,
      type,
      timestamp: new Date().toISOString(),
    });
  }

  reactionsStore.write(allReactions);
  res.status(200).json({ success: true });
});

export default router;