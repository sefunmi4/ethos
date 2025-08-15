import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/authMiddleware';
import authOptional from '../middleware/authOptional';
import { postsStore, usersStore, reactionsStore, questsStore, notificationsStore, boardsStore } from '../models/stores';
import { pool, usePg } from '../db';
import { enrichPost } from '../utils/enrich';
import { generateNodeId } from '../utils/nodeIdUtils';
import type { DBPost, DBQuest } from '../types/db';
import type { AuthenticatedRequest } from '../types/express';
import type { PostType, LinkedItem } from '../types/api';


const makeQuestNodeTitle = (content: string): string => {
  const text = content.trim();
  // TODO: Replace simple truncation with AI-generated summaries
  return text.length <= 50 ? text : text.slice(0, 50) + '…';
};

const router = express.Router();

//
// ✅ GET all posts
//
router.get('/', authOptional, async (_req: Request, res: Response): Promise<void> => {
  if (usePg) {
    try {
      const result = await pool.query('SELECT * FROM posts');
      res.json(result.rows);
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
  }
  const posts = postsStore.read();
  res.json(posts);
});

// GET recent posts. If userId is provided, return posts related to that user.
router.get(
  '/recent',
  authOptional,
  (
    req: Request<{}, any, any, { userId?: string; hops?: string }>,
    res: Response
  ): void => {
    const { userId } = req.query;
    const posts = postsStore.read();
    const quests = questsStore.read();
    const users = usersStore.read();

    let filtered: DBPost[] = [];

    if (userId) {
      // Posts authored by the user
      const authored = posts.filter(p => p.authorId === userId);

      // Posts in quests the user authored or collaborates on
      const relatedQuestIds = quests
        .filter(
          q =>
            q.authorId === userId ||
            (q.collaborators || []).some(c => c.userId === userId)
        )
        .map(q => q.id);
      const questPosts = posts.filter(
        p => p.questId && relatedQuestIds.includes(p.questId)
      );

      const userPostIds = new Set(authored.map(p => p.id));

      // Posts replying to any post by the user
      const replies = posts.filter(p => p.replyTo && userPostIds.has(p.replyTo));

      // Posts in quests that contain any user-authored post
      const userQuestIds = new Set(
        authored.map(p => p.questId).filter((id): id is string => Boolean(id))
      );
      const questActivity = posts.filter(
        p => p.questId && userQuestIds.has(p.questId)
      );

      filtered = [
        ...authored,
        ...questPosts,
        ...replies,
        ...questActivity,
      ];
    } else {
      // Public recent posts across the site
      filtered = posts.filter(
        p =>
          p.visibility === 'public' ||
          p.visibility === 'request_board' ||
          p.needsHelp === true
      );
    }

    const recent = filtered
      .filter(p => p.systemGenerated !== true)
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
      .slice(0, 20)
      .map(p => enrichPost(p, { users, currentUserId: userId || null }));

    res.json(recent);
  }
);

//
// ✅ GET a single post by ID
//

//
// ✅ POST create a new post
//
router.post(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const {
      type = 'free_speech',
      title = '',
      content = '',
      details = '',
      visibility = 'public',
      tags = [],
      questId = null,
      replyTo = null,
      linkedItems = [],
      linkedNodeId,
      collaborators = [],
      status,
      boardId,
      taskType = 'abstract',
      helpRequest = false,
      needsHelp = undefined,
      rating,
      subtype,
    } = req.body;

    const allowedTypes: PostType[] = [
      'free_speech',
      'request',
      'task',
      'file',
      'review',
    ];
    if (!allowedTypes.includes(type)) {
      res.status(400).json({ error: 'Invalid post type' });
      return;
    }

    const posts: DBPost[] = postsStore.read();
    const quests: DBQuest[] = questsStore.read();
    const quest = questId ? quests.find((q: DBQuest) => q.id === questId) : null;
    const parent = replyTo ? posts.find((p: DBPost) => p.id === replyTo) : null;

    if (parent) {
      const userId = req.user?.id;
      const isParticipant =
        parent.authorId === userId ||
        (parent.collaborators || []).some(c => c.userId === userId);

      if (['task', 'file'].includes(parent.type)) {
        if (!isParticipant && type !== 'free_speech') {
          res.status(400).json({
            error: 'Only free_speech replies allowed for non-participants',
          });
          return;
        }
      }

      if (
        parent.type === 'task' &&
        !['free_speech', 'task', 'file'].includes(type)
      ) {
        res.status(400).json({
          error: 'Tasks only accept free_speech, task, or file replies',
        });
        return;
      }
      if (
        parent.type === 'file' &&
        !['free_speech', 'file'].includes(type)
      ) {
        res
          .status(400)
          .json({ error: 'Files only accept file or free_speech replies' });
        return;
      }
    }

    if (type === 'task') {
      if (parent && parent.type === 'file') {
        res
          .status(400)
          .json({ error: 'Tasks cannot reply to files' });
        return;
      }
    } else if (type === 'file') {
      const hasParent =
        parent && ['task', 'request', 'file'].includes(parent.type);
      const hasTaskLink = (linkedItems || []).some(
        (li: LinkedItem) => li.itemType === 'post'
      );
      if (!hasParent && !hasTaskLink) {
        res
          .status(400)
          .json({
            error: 'Files must reply to or link a task, request, or file',
          });
        return;
      }
    } else if (type === 'request') {
      if (!subtype || !['task', 'file'].includes(subtype)) {
        res
          .status(400)
          .json({ error: 'Request posts must specify subtype "task" or "file"' });
        return;
      }
      if (subtype === 'file' && (!parent || parent.type !== 'task')) {
        res
          .status(400)
          .json({ error: 'File requests must reply to a task' });
        return;
      }
    } else if (type === 'review') {
      if (!parent || parent.type !== 'request') {
        res
          .status(400)
          .json({ error: 'Reviews must reply to a request' });
        return;
      }
    }

    const finalStatus =
      status ?? (type === 'task' ? 'To Do' : type === 'request' ? 'In Progress' : undefined);

    if (boardId === 'quest-board') {
      if (type !== 'request') {
        res
          .status(400)
          .json({ error: 'Only request posts allowed on this board' });
        return;
      }
    }

    const effectiveBoardId = boardId || (type === 'request' ? 'quest-board' : undefined);

    const newPost: DBPost = {
      id: uuidv4(),
      authorId: req.user!.id,
      type,
      title: type === 'task' ? content : title || makeQuestNodeTitle(content),
      content,
      createdAt: new Date().toISOString(),
      details,
      visibility,
      timestamp: new Date().toISOString(),
      tags,
      collaborators,
      replyTo,
      repostedFrom: null,
      linkedItems,
      linkedNodeId,
      questId,
      ...(type === 'task' ? { taskType } : {}),
      ...(subtype ? { subtype } : {}),
      ...(type === 'review' && rating ? { rating: Math.min(5, Math.max(0, Number(rating))) } : {}),
      status: finalStatus,
      helpRequest: type === 'request' || helpRequest,
      needsHelp: type === 'request' ? needsHelp ?? true : undefined,
      nodeId:
        quest
          ? generateNodeId({ quest, posts, postType: type, parentPost: parent })
          : type === 'task' && !replyTo
            ? 'T00'
            : undefined,
      boardId: effectiveBoardId,
    };

    if (type === 'request') {
      const summaryTags = new Set([
        ...(newPost.tags || []),
        'summary:request',
        `summary:${subtype}`,
        `summary:user:${req.user?.username || req.user?.id}`,
      ]);
      newPost.tags = Array.from(summaryTags);
    }

    if (questId && (!newPost.questNodeTitle || newPost.questNodeTitle.trim() === '')) {
      newPost.questNodeTitle = makeQuestNodeTitle(content);
    }

    if (usePg) {
      try {
        await pool.query(
          'INSERT INTO posts (id, authorid, type, content, title, visibility, tags, boardid, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [
            newPost.id,
            newPost.authorId,
            newPost.type,
            newPost.content,
            newPost.title,
            newPost.visibility,
            newPost.tags,
            effectiveBoardId,
            newPost.timestamp,
          ]
        );
        if (effectiveBoardId && effectiveBoardId !== 'quest-board') {
          await pool.query(
            "UPDATE boards SET items = COALESCE(items, '[]'::jsonb) || $1::jsonb WHERE id = $2",
            [JSON.stringify([newPost.id]), effectiveBoardId]
          );
        }
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
    } else {
      posts.push(newPost);
      postsStore.write(posts);
      if (effectiveBoardId && effectiveBoardId !== 'quest-board') {
        const boards = boardsStore.read();
        const board = boards.find(b => b.id === effectiveBoardId);
        if (board) {
          board.items = Array.from(new Set([...(board.items || []), newPost.id]));
          boardsStore.write(boards);
        }
      }
    }

    if (replyTo) {
      const parent = posts.find(p => p.id === replyTo);
      if (parent) {
        const users = usersStore.read();
        const author = users.find(u => u.id === req.user!.id);
        const followers = new Set([parent.authorId, ...(parent.followers || [])]);
        for (const uid of followers) {
          if (uid === author?.id) continue;
          const newNote = {
            id: uuidv4(),
            userId: uid,
            message: `${author?.username || 'Someone'} replied to a post you follow`,
            link: `/posts/${parent.id}`,
            read: false,
            createdAt: new Date().toISOString(),
          };
          try {
            await pool.query(
              'INSERT INTO notifications (id, userid, message, link, read, createdat) VALUES ($1,$2,$3,$4,$5,$6)',
              [newNote.id, newNote.userId, newNote.message, newNote.link, newNote.read, newNote.createdAt]
            );
          } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database error' });
            return;
          }
        }
      }
    }

    if (questId && type === 'task') {
      const quest = quests.find((q) => q.id === questId);
      if (quest) {
        quest.taskGraph = quest.taskGraph || [];
        const parentId = replyTo || linkedNodeId || quest.headPostId || '';
        const exists = quest.taskGraph.some(
          (e) => e.from === parentId && e.to === newPost.id
        );
        if (!exists) {
          quest.taskGraph.push({ from: parentId, to: newPost.id });
        }
        questsStore.write(quests);
      }
    }

    const users = usersStore.read();
    res.status(201).json(enrichPost(newPost, { users }));
  }
);

//
// ✅ PATCH update post
//
router.patch(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> => {
    const posts = postsStore.read();
  const quests = questsStore.read();
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }
  if (post.systemGenerated === true && req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Cannot modify system post' });
    return;
  }

  const originalQuestId = post.questId;
  const originalReplyTo = post.replyTo;
  const originalType = post.type;

  Object.assign(post, req.body);

  if (post.type === 'review' && typeof post.rating === 'number') {
    post.rating = Math.min(5, Math.max(0, post.rating));
  }

  if (post.type === 'task') {
    post.title = post.content;
  } else if (post.type !== 'free_speech' && (!post.title || post.title.trim() === '')) {
    post.title = makeQuestNodeTitle(post.content);
  }

  if (
    post.questId &&
    (!post.questNodeTitle || post.questNodeTitle.trim() === '')
  ) {
    post.questNodeTitle = makeQuestNodeTitle(post.content);
  }

  const questIdChanged =
    'questId' in req.body && req.body.questId !== originalQuestId;
  const replyToChanged =
    'replyTo' in req.body && req.body.replyTo !== originalReplyTo;
  const typeChanged = 'type' in req.body && req.body.type !== originalType;

  if (questIdChanged || replyToChanged || typeChanged) {
    const quest = post.questId
      ? quests.find((q) => q.id === post.questId)
      : null;
      const parent = post.replyTo
        ? posts.find((p) => p.id === post.replyTo) || null
        : null;
      if (parent) {
        if (
          parent.type === 'task' &&
          !['free_speech', 'task', 'file'].includes(post.type)
        ) {
          res.status(400).json({
            error: 'Tasks only accept free_speech, task, or file replies',
          });
          return;
        }
        if (parent.type === 'file' && post.type !== 'file') {
          res
            .status(400)
            .json({ error: 'Files only accept file replies' });
          return;
        }
      }
      const otherPosts = posts.filter((p) => p.id !== post.id);
      post.nodeId = quest
        ? generateNodeId({
            quest,
            posts: otherPosts,
            postType: post.type,
            parentPost: parent,
          })
        : post.type === 'task' && !post.replyTo
          ? 'T00'
          : undefined;
    }

    postsStore.write(posts);
    const users = usersStore.read();
    res.json(enrichPost(post, { users }));
  }
);
//
// ✅ GET /api/posts/:id/replies – Fetch direct replies to a post
//
router.get('/:id/replies', (req: Request<{ id: string }>, res: Response) => {
  const posts = postsStore.read();
  const replies = posts.filter((p) => p.replyTo === req.params.id);
  const users = usersStore.read();
  res.json({ replies: replies.map((p) => enrichPost(p, { users })) });
});

// POST /api/posts/:id/follow - follow a post
router.post('/:id/follow', authMiddleware, async (req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> => {
  const posts = postsStore.read();
  const users = usersStore.read();
  const post = posts.find(p => p.id === req.params.id);
  const follower = users.find(u => u.id === req.user!.id);
  if (!post || !follower) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }
  post.followers = Array.from(new Set([...(post.followers || []), follower.id]));
  postsStore.write(posts);
  const newNote = {
    id: uuidv4(),
    userId: post.authorId,
    message: `${follower.username} followed your post`,
    link: `/posts/${post.id}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  try {
    await pool.query(
      'INSERT INTO notifications (id, userid, message, link, read, createdat) VALUES ($1,$2,$3,$4,$5,$6)',
      [newNote.id, newNote.userId, newNote.message, newNote.link, newNote.read, newNote.createdAt]
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
    return;
  }
  res.json({ followers: post.followers });
});

// POST /api/posts/:id/unfollow - unfollow a post
router.post('/:id/unfollow', authMiddleware, (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  const posts = postsStore.read();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }
  post.followers = (post.followers || []).filter(id => id !== req.user!.id);
  postsStore.write(posts);
  res.json({ followers: post.followers });
});

//
// ✅ POST /api/posts/:id/repost – Repost a post
//
//
// ✅ POST /api/posts/:id/repost – Repost a post
//
router.post(
  '/:id/repost',
  authMiddleware,
  (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
    const posts = postsStore.read();
    const original = posts.find((p) => p.id === req.params.id);
    if (!original) return void res.status(404).json({ error: 'Original post not found' });

    const users = usersStore.read();
    const authorUsername = users.find(u => u.id === req.user!.id)?.username || '';
    const originalAuthorUsername = users.find(u => u.id === original.authorId)?.username || '';

    const repost: DBPost = {
      id: uuidv4(),
      authorId: req.user!.id,
      type: original.type,
      content: original.content,
      createdAt: new Date().toISOString(),
      visibility: original.visibility,
      questId: original.questId || null,
      tags: [...(original.tags || [])],
      collaborators: [], // reposts are solo unless explicitly assigned
      replyTo: null,
      timestamp: new Date().toISOString(),
      repostedFrom: original.id,
      linkedItems: (original.linkedItems || []).filter(li => li.itemType !== 'post'),

      // 🧹 Clear non-transferable or enriched fields
      enriched: false,
      systemGenerated: false,
      autoGeneratedReason: undefined,
      status: undefined,
      questNodeTitle: undefined,
      nodeId: undefined,
      linkedNodeId: undefined,
      gitDiff: undefined,
      commitSummary: undefined,
      reactions: undefined,
      reactionCounts: undefined,
    };

    posts.push(repost);
    postsStore.write(posts);

    if (usePg) {
      try {
        pool.query(
          `INSERT INTO reactions (id, postid, userid, type)
           VALUES ($1, $2, $3, 'repost')
           ON CONFLICT (postid, userid, type) DO NOTHING`,
          [uuidv4(), req.params.id, req.user!.id]
        ).catch((err) => console.error(err));
      } catch (err) {
        console.error(err);
      }
    } else {
      const reactions = reactionsStore.read();
      const key = `${req.params.id}_${req.user!.id}_repost`;
      if (!reactions.includes(key)) {
        reactions.push(key);
        reactionsStore.write(reactions);
      }
    }
    res.status(201).json(enrichPost(repost, { users }));
  }
);

//
// ✅ DELETE /api/posts/:id/repost – Remove current user's repost
//
router.delete(
  '/:id/repost',
  authMiddleware,
  (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
    const posts = postsStore.read();
    const index = posts.findIndex(
      (p) => p.repostedFrom === req.params.id && p.authorId === req.user!.id
    );
    if (index === -1) {
      res.status(404).json({ error: 'Repost not found' });
      return;
    }
    const [removed] = posts.splice(index, 1);
    postsStore.write(posts);

    if (usePg) {
      try {
        pool
          .query(
            'DELETE FROM reactions WHERE postid = $1 AND userid = $2 AND type = $3',
            [req.params.id, req.user!.id, 'repost']
          )
          .catch((err) => console.error(err));
      } catch (err) {
        console.error(err);
      }
    } else {
      const reactions = reactionsStore.read();
      const key = `${req.params.id}_${req.user!.id}_repost`;
      const idx = reactions.indexOf(key);
      if (idx !== -1) {
        reactions.splice(idx, 1);
        reactionsStore.write(reactions);
      }
    }
    res.json({ success: true, id: removed.id });
  }
);

//
// ✅ GET /api/posts/:id/reposts/user – Get current user's repost of a post
//
router.get(
  '/:id/reposts/user',
  authMiddleware,
  (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
    const posts = postsStore.read();
    const repost = posts.find(
      (p) => p.repostedFrom === req.params.id && p.authorId === req.user!.id
    );
    const users = usersStore.read();
    res.json(repost ? enrichPost(repost, { users }) : null);
  }
);

//
// ✅ GET /api/posts/:id/reposts/count – Count of reposts
//
router.get('/:id/reposts/count', (_req: Request<{ id: string }>, res: Response) => {
  const posts = postsStore.read();
  const count = posts.filter((p) => p.repostedFrom === _req.params.id).length;
  res.json({ count });
});

//
// ✅ POST /api/posts/:id/reactions/:type – Toggle reaction (like/heart)
//
router.post(
  '/:id/reactions/:type',
  authMiddleware,
  async (
    req: AuthenticatedRequest<{ id: string; type: string }>,
    res: Response
  ): Promise<void> => {
    const { id, type } = req.params;
    const userId = req.user!.id;
    const state = req.body?.state as string | undefined;

    if (usePg) {
      try {
        await pool.query(
          'DELETE FROM reactions WHERE postid = $1 AND userid = $2 AND type LIKE $3',
          [id, userId, `${type}%`]
        );
        const storedType = state ? `${type}:${state}` : type;
        await pool.query(
          'INSERT INTO reactions (id, postid, userid, type) VALUES ($1, $2, $3, $4)',
          [uuidv4(), id, userId, storedType]
        );
        res.json({ success: true });
        return;
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
    }

    const reactions = reactionsStore.read();
    const prefix = `${id}_${userId}_${type}`;
    const filtered = reactions.filter(r => !r.startsWith(prefix));
    filtered.push(state ? `${prefix}_${state}` : prefix);
    reactionsStore.write(filtered);

    res.json({ success: true });
  }
);

//
// ✅ DELETE /api/posts/:id/reactions/:type – Remove reaction
//
router.delete(
  '/:id/reactions/:type',
  authMiddleware,
  async (
    req: AuthenticatedRequest<{ id: string; type: string }>,
    res: Response
  ): Promise<void> => {
    const { id, type } = req.params;
    const userId = req.user!.id;

    if (usePg) {
      try {
        await pool.query(
          'DELETE FROM reactions WHERE postid = $1 AND userid = $2 AND type LIKE $3',
          [id, userId, `${type}%`]
        );
        res.json({ success: true });
        return;
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
    }

    const reactions = reactionsStore.read();
    const prefix = `${id}_${userId}_${type}`;
    const filtered = reactions.filter(r => !r.startsWith(prefix));
    reactionsStore.write(filtered);

    res.json({ success: true });
  }
);

//
// ✅ GET /api/posts/:id/reactions – Get all reactions on a post
//
router.get(
  '/:id/reactions',
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params;

    if (usePg) {
      try {
        const result = await pool.query(
          'SELECT userid AS "userId", type FROM reactions WHERE postid = $1',
          [id]
        );
        const rows = result.rows.map((r) => {
          const [base, state] = r.type.split(':');
          return state ? { userId: r.userId, type: base, state } : { userId: r.userId, type: base };
        });
        res.json(rows);
        return;
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
    }

    const reactions = reactionsStore.read();
    const postReactions = reactions
      .filter((r) => r.startsWith(`${id}_`))
      .map((r) => {
        const parts = r.split('_');
        const [, userId, type, state] = parts;
        return state ? { userId, type, state } : { userId, type };
      });

    res.json(postReactions);
  }
);

//
// ✅ POST /api/tasks/:id/request-help – Create a help request from a task
//
router.post(
  '/tasks/:id/request-help',
  authMiddleware,
  (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
    const posts = postsStore.read();
    const task = posts.find(p => p.id === req.params.id && p.type === 'task');
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    task.helpRequest = true;
    task.needsHelp = true;
    task.tags = Array.from(new Set([...(task.tags || []), 'request']));
    postsStore.write(posts);

    if (usePg) {
      try {
        pool
          .query(
            `INSERT INTO reactions (id, postid, userid, type)
             VALUES ($1, $2, $3, 'request')
             ON CONFLICT (postid, userid, type) DO NOTHING`,
            [uuidv4(), req.params.id, req.user!.id]
          )
          .catch((err) => console.error(err));
      } catch (err) {
        console.error(err);
      }
    } else {
      const reactions = reactionsStore.read();
      const key = `${req.params.id}_${req.user!.id}_request`;
      if (!reactions.includes(key)) {
        reactions.push(key);
        reactionsStore.write(reactions);
      }
    }

    const users = usersStore.read();
    res.status(200).json({ post: enrichPost(task, { users }) });
  }
);

//
// ✅ POST /api/posts/:id/request-help – Create a help request from any post
//
router.post(
  '/:id/request-help',
  authMiddleware,
  async (req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> => {
    const posts = postsStore.read();
    let original = posts.find(p => p.id === req.params.id);

    // Fallback to PostgreSQL if the post isn't in the JSON store
    if (!original && usePg) {
      try {
        const { rows } = await pool.query(
          'SELECT * FROM posts WHERE id = $1',
          [req.params.id]
        );
        if (rows.length > 0) {
          original = {
            id: rows[0].id,
            authorId: rows[0].authorid,
            type: rows[0].type,
            content: rows[0].content,
            visibility: rows[0].visibility,
            tags: rows[0].tags || [],
            timestamp: rows[0].timestamp?.toISOString?.() || rows[0].timestamp,
          } as DBPost;
          posts.push(original);
          postsStore.write(posts);
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (!original) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const subtype = req.body?.subtype || (original.type === 'task' ? 'task' : 'file');
    if (subtype === 'file' && !['task', 'file'].includes(original.type)) {
      res.status(400).json({ error: 'File requests must originate from a task or file' });
      return;
    }

    const tag = subtype === 'file' ? 'review' : 'request';
    const users = usersStore.read();

    const timestamp = new Date().toISOString();
    const tagSet = new Set([...(original.tags || []), 'request']);
    if (subtype === 'file') tagSet.add('review');
    let repost: DBPost = {
      id: uuidv4(),
      authorId: req.user!.id,
      type: 'request',
      subtype,
      content: original.content,
      createdAt: timestamp,
      visibility: original.visibility,
      questId: original.questId || null,
      tags: Array.from(tagSet),
      collaborators: [],
      replyTo: null,
      timestamp,
      repostedFrom: original.id,
      linkedItems: (original.linkedItems || []).filter(li => li.itemType !== 'post'),
    } as DBPost;

    // Add summary tags for easier filtering
    const summaryTags = new Set([
      ...(repost.tags || []),
      'summary:request',
      ...(subtype === 'file' ? ['summary:review'] : []),
      `summary:${subtype}`,
      `summary:user:${req.user?.username || req.user?.id}`,
    ]);
    repost.tags = Array.from(summaryTags);

    posts.push(repost);
    postsStore.write(posts);

    if (usePg) {
      try {
        await pool.query(
          'INSERT INTO posts (id, authorid, type, content, title, visibility, tags, boardid, timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
          [
            repost.id,
            repost.authorId,
            'request',
            repost.content,
            original.title || '',
            repost.visibility,
            repost.tags,
            'quest-board',
            timestamp,
          ]
        );
        pool
          .query(
            `INSERT INTO reactions (id, postid, userid, type)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (postid, userid, type) DO NOTHING`,
            [uuidv4(), req.params.id, req.user!.id, tag]
          )
          .catch((err) => console.error(err));
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
    } else {
      const reactions = reactionsStore.read();
      const key = `${req.params.id}_${req.user!.id}_${tag}`;
      if (!reactions.includes(key)) {
        reactions.push(key);
        reactionsStore.write(reactions);
      }
    }

    res.status(201).json({ post: enrichPost(repost, { users }) });
  }
);

//
// ❌ DELETE /api/posts/:id/request-help – Cancel help request and remove linked request posts
//
router.delete(
  '/:id/request-help',
  authMiddleware,
  async (req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> => {
    const posts = postsStore.read();
    let original = posts.find(p => p.id === req.params.id);

    if (!original && usePg) {
      try {
        const { rows } = await pool.query(
          'SELECT * FROM posts WHERE id = $1',
          [req.params.id]
        );
        if (rows.length > 0) {
          original = {
            id: rows[0].id,
            authorId: rows[0].authorid,
            type: rows[0].type,
            content: rows[0].content,
            visibility: rows[0].visibility,
            tags: rows[0].tags || [],
            timestamp: rows[0].timestamp?.toISOString?.() || rows[0].timestamp,
          } as DBPost;
          posts.push(original);
          postsStore.write(posts);
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (!original) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const tag = req.body?.subtype === 'file' ? 'review' : 'request';

    const index = posts.findIndex(
      p =>
        p.repostedFrom === req.params.id &&
        p.authorId === req.user!.id &&
        (p.tags || []).includes(tag)
    );
    if (index === -1) {
      res.status(404).json({ error: 'Request repost not found' });
      return;
    }

    const [removed] = posts.splice(index, 1);
    postsStore.write(posts);

    if (usePg) {
      try {
        await pool.query('DELETE FROM posts WHERE id = $1', [removed.id]);
        pool
          .query(
            'DELETE FROM reactions WHERE postid = $1 AND userid = $2 AND type = $3',
            [req.params.id, req.user!.id, tag]
          )
          .catch((err) => console.error(err));
      } catch (err) {
        console.error(err);
      }
    } else {
      const reactions = reactionsStore.read();
      const key = `${req.params.id}_${req.user!.id}_${tag}`;
      const idx = reactions.indexOf(key);
      if (idx !== -1) {
        reactions.splice(idx, 1);
        reactionsStore.write(reactions);
      }
    }

    res.json({ success: true, id: removed.id });
  }
);

//
// ✅ POST /api/posts/:id/accept – Accept a help request
// Marks the post as pending for the current user and joins or creates a quest
//
router.post(
  '/:id/accept',
  authMiddleware,
  async (req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> => {
    const posts = postsStore.read();
    const quests = questsStore.read();

    const post = posts.find(p => p.id === req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const userId = req.user!.id;
    post.tags = Array.from(new Set([...(post.tags || []), `pending:${userId}`]));

    let quest = post.questId ? quests.find(q => q.id === post.questId) : null;

    if (quest) {
      const exists = (quest.collaborators || []).some(c => c.userId === userId);
      if (!exists) {
        quest.collaborators = quest.collaborators || [];
        quest.collaborators.push({ userId });
      }
    } else {
      quest = {
        id: uuidv4(),
        authorId: userId,
        title: makeQuestNodeTitle(post.content),
        description: '',
        visibility: 'public',
        approvalStatus: 'approved',
        flagCount: 0,
        status: 'active',
        headPostId: post.id,
        linkedPosts: [],
        collaborators: [{ userId }],
        createdAt: new Date().toISOString(),
        tags: [],
        displayOnBoard: true,
        taskGraph: [],
        helpRequest: true,
      } as DBQuest;
      quests.push(quest);
      post.questId = quest.id;
      post.questNodeTitle = makeQuestNodeTitle(post.content);
    }

    const parent = post.replyTo ? posts.find(p => p.id === post.replyTo) : null;

    let created: DBPost | null = null;
    if (parent && parent.type === 'file') {
      const createdTimestamp = new Date().toISOString();
      created = {
        id: uuidv4(),
        authorId: userId,
        type: 'review',
        title: makeQuestNodeTitle(post.content),
        content: '',
        visibility: 'public',
        createdAt: createdTimestamp,
        timestamp: createdTimestamp,
        replyTo: parent.id,
      } as DBPost;
    } else if (parent && parent.type === 'task') {
      const createdTimestamp = new Date().toISOString();
      created = {
        id: uuidv4(),
        authorId: userId,
        type: 'file',
        title: makeQuestNodeTitle(post.content),
        content: '',
        visibility: 'public',
        createdAt: createdTimestamp,
        timestamp: createdTimestamp,
        replyTo: parent.id,
      } as DBPost;
    } else {
      const createdTimestamp = new Date().toISOString();
      created = {
        id: uuidv4(),
        authorId: userId,
        type: 'task',
        title: makeQuestNodeTitle(post.content),
        content: '',
        visibility: 'public',
        createdAt: createdTimestamp,
        timestamp: createdTimestamp,
        replyTo: post.id,
        status: 'To Do',
      } as DBPost;
    }

    posts.push(created);

    questsStore.write(quests);
    postsStore.write(posts);

    const users = usersStore.read();

      const follower = users.find(u => u.id === req.user!.id);
      if (follower && post.authorId !== follower.id) {
        const newNote = {
          id: uuidv4(),
          userId: post.authorId,
          message: `${follower.username} requested to join your post`,
          link: `/posts/${post.id}`,
          read: false,
          createdAt: new Date().toISOString(),
        };
        if (usePg) {
          try {
            await pool.query(
              'INSERT INTO notifications (id, userid, message, link, read, createdat) VALUES ($1,$2,$3,$4,$5,$6)',
              [newNote.id, newNote.userId, newNote.message, newNote.link, newNote.read, newNote.createdAt]
            );
          } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database error' });
            return;
          }
        } else {
          const notes = notificationsStore.read();
          notes.push(newNote);
          notificationsStore.write(notes);
        }
      }

    res.json({
      post: enrichPost(post, { users }),
      quest,
      created: enrichPost(created, { users }),
    });
  }
);

//
// ✅ POST /api/posts/:id/unaccept – Cancel a help request acceptance
// Removes the pending tag for the current user
//
router.post(
  '/:id/unaccept',
  authMiddleware,
  (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
    const posts = postsStore.read();

    const post = posts.find(p => p.id === req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const userId = req.user!.id;
    post.tags = (post.tags || []).filter(t => t !== `pending:${userId}`);

    postsStore.write(posts);

    const users = usersStore.read();
    res.json({ post: enrichPost(post, { users }) });
  }
);

//
// ✅ POST /api/posts/:id/unaccept – Undo accepting a help request
// Removes the pending tag for the current user
//
router.post(
  '/:id/unaccept',
  authMiddleware,
  (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
    const posts = postsStore.read();
    const post = posts.find(p => p.id === req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const userId = req.user!.id;
    post.tags = (post.tags || []).filter(t => t !== `pending:${userId}`);
    postsStore.write(posts);

    const users = usersStore.read();
    res.json({ post: enrichPost(post, { users }) });
  }
);

//
// ✅ POST /api/posts/:id/solve – Mark a post as solved
//
router.post(
  '/:id/solve',
  authMiddleware,
  (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
    const posts = postsStore.read();
    const post = posts.find((p) => p.id === req.params.id);
    if (!post) return void res.status(404).json({ error: 'Post not found' });

    post.tags = [...(post.tags || []), 'solved'];
    postsStore.write(posts);
    res.json({ success: true });
  }
);

//
// ✅ POST /api/posts/:id/archive – Archive a post
//
router.post(
  '/:id/archive',
  authMiddleware,
  async (req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> => {
    if (usePg) {
      try {
        await pool.query(
          "UPDATE posts SET tags = ARRAY(SELECT DISTINCT UNNEST(COALESCE(tags, '{}'::text[]) || ARRAY['archived'])) WHERE id = $1",
          [req.params.id]
        );
        res.json({ success: true });
        return;
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
    }

    const posts = postsStore.read();
    const post = posts.find((p) => p.id === req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    post.tags = Array.from(new Set([...(post.tags || []), 'archived']));
    if (post.type === 'task' && post.questId) {
      const quests = questsStore.read();
      const quest = quests.find(q => q.id === post.questId);
      if (quest) {
        const edges = quest.taskGraph || [];
        const parentEdge = edges.find(e => e.to === post.id);
        const parentId = parentEdge ? parentEdge.from : quest.headPostId || '';
        const childEdges = edges.filter(e => e.from === post.id);
        quest.taskGraph = edges.filter(e => e.from !== post.id);
        if (parentId) {
          childEdges.forEach(e => {
            const exists = quest.taskGraph!.some(
              se => se.from === parentId && se.to === e.to
            );
            if (!exists) {
              quest.taskGraph!.push({ ...e, from: parentId });
            }
          });
        }
        questsStore.write(quests);
      }
    }
    postsStore.write(posts);
    res.json({ success: true });
  }
);

//
// ✅ DELETE /api/posts/:id/archive – Remove archived tag
//
router.delete(
  '/:id/archive',
  authMiddleware,
  async (req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> => {
    if (usePg) {
      try {
        await pool.query(
          "UPDATE posts SET tags = array_remove(tags, 'archived') WHERE id = $1",
          [req.params.id]
        );
        res.json({ success: true });
        return;
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
    }

    const posts = postsStore.read();
    const post = posts.find((p) => p.id === req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    post.tags = (post.tags || []).filter((t) => t !== 'archived');
    postsStore.write(posts);
    res.json({ success: true });
  }
);

//
// ✅ DELETE /api/posts/:id – Permanently remove a post
//
router.delete(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> => {
    if (usePg) {
      try {
        const result = await pool.query(
          'DELETE FROM posts WHERE id = $1 RETURNING *',
          [req.params.id]
        );
        const post = result.rows[0];
        if (!post) {
          res.status(404).json({ error: 'Post not found' });
          return;
        }
        await pool
          .query(
            "DELETE FROM reactions WHERE postid IN (SELECT id FROM posts WHERE repostedfrom = $1 AND type = 'request')",
            [req.params.id]
          )
          .catch((err) => console.error(err));
        await pool
          .query(
            "DELETE FROM posts WHERE repostedfrom = $1 AND type = 'request'",
            [req.params.id]
          )
          .catch((err) => console.error(err));
        await pool
          .query(
            "DELETE FROM reactions WHERE postid = $1 AND type IN ('request','review')",
            [req.params.id]
          )
          .catch((err) => console.error(err));
        res.json({ success: true });
        return;
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
    }

    const posts = postsStore.read();
    const quests = questsStore.read();
    const index = posts.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const post = posts[index];
    if (post.questId) {
      const questIndex = quests.findIndex(
        (q) => q.id === post.questId && q.headPostId === post.id
      );
      if (questIndex !== -1) {
        // Deleting the head post deletes the entire quest instead
        const [removedQuest] = quests.splice(questIndex, 1);
        questsStore.write(quests);
        res.json({ success: true, questDeleted: removedQuest.id });
        return;
      }
    }

    if (post.type === 'task' && post.questId) {
      const quest = quests.find(q => q.id === post.questId);
      if (quest) {
        const edges = quest.taskGraph || [];
        const parentEdge = edges.find(e => e.to === post.id);
        const parentId = parentEdge ? parentEdge.from : quest.headPostId || '';
        const childEdges = edges.filter(e => e.from === post.id);
        quest.taskGraph = edges.filter(e => e.to !== post.id && e.from !== post.id);
        if (parentId) {
          childEdges.forEach(e => {
            const exists = quest.taskGraph!.some(
              se => se.from === parentId && se.to === e.to
            );
            if (!exists) {
              quest.taskGraph!.push({ ...e, from: parentId });
            }
          });
        }
        questsStore.write(quests);
      }
    }

    const requestIds = posts
      .filter(p => p.repostedFrom === post.id && p.type === 'request')
      .map(p => p.id);
    requestIds.forEach(rid => {
      const rIndex = posts.findIndex(p => p.id === rid);
      if (rIndex !== -1) posts.splice(rIndex, 1);
    });
    posts.splice(index, 1);
    postsStore.write(posts);
    const boards = boardsStore.read();
    const questBoard = boards.find(b => b.id === 'quest-board');
    if (questBoard) {
      const toRemove = new Set([req.params.id, ...requestIds]);
      questBoard.items = (questBoard.items || []).filter(id => !toRemove.has(id));
      boardsStore.write(boards);
    }
    const reactions = reactionsStore.read();
    const filtered = reactions.filter(r => {
      const [postId] = r.split('_');
      if (postId === req.params.id) {
        return !(r.endsWith('_request') || r.endsWith('_review'));
      }
      return !requestIds.includes(postId);
    });
    reactionsStore.write(filtered);
    res.json({ success: true });
  }
);

//
// ✅ GET /api/posts/:id/linked – Get all posts linked to a post
//
router.get('/:id/linked', (req: Request<{ id: string }>, res: Response) => {
  const posts = postsStore.read();
  const linked = posts.filter((p) => p.replyTo === req.params.id);
  const users = usersStore.read();
  res.json({ posts: linked.map((p) => enrichPost(p, { users })) });
});

//
// ✅ GET /api/posts/:id/propagation-status – Simulate cascade status
//
router.get('/:id/propagation-status', (req: Request<{ id: string }>, res: Response) => {
  // This is a placeholder – you can replace with actual propagation logic
  const affected = [req.params.id];
  res.json({ cascadeCompleted: true, affectedIds: affected });
});

//
// ✅ GET single post (placed last to avoid route conflicts)
//
router.get('/:id', authOptional, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  if (usePg) {
    try {
      const result = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
      const row = result.rows[0];
      if (!row) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }
      const post: DBPost = {
        id: row.id,
        authorId: row.authorid,
        type: row.type,
        content: row.content,
        title: row.title,
        visibility: row.visibility,
        tags: Array.isArray(row.tags)
          ? row.tags
          : typeof row.tags === 'string'
          ? row.tags
              .replace(/[{}]/g, '')
              .split(',')
              .map((t: string) => t.replace(/"/g, '').trim())
              .filter(Boolean)
          : [],
        boardId: row.boardid ?? undefined,
        timestamp:
          row.timestamp instanceof Date
            ? row.timestamp.toISOString()
            : row.timestamp,
        createdAt:
          row.createdat instanceof Date
            ? row.createdat.toISOString()
            : row.createdat,
      };
      const users = usersStore.read();
      res.json(
        enrichPost(post, {
          users,
          currentUserId: ((req as any).user?.id as string) || null,
        })
      );
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
  }
  const posts = postsStore.read();
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }
  if (post.systemGenerated === true && (req as any).user?.role !== 'admin') {
    res.status(403).json({ error: 'Access denied' });
    return;
  }
  const users = usersStore.read();
  res.json(enrichPost(post, { users, currentUserId: (req as any).user?.id || null }));
});

export default router;
