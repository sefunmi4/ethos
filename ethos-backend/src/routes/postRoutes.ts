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

      // Posts linking to any post by the user
      const linked = posts.filter(p =>
        (p.linkedItems || []).some(
          li => li.itemType === 'post' && userPostIds.has(li.itemId)
        )
      );

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
        ...linked,
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
    } = req.body;

    const allowedTypes: PostType[] = [
      'free_speech',
      'request',
      'project',
      'task',
      'change',
      'review',
    ];
    if (!allowedTypes.includes(type)) {
      res.status(400).json({ error: 'Invalid post type' });
      return;
    }

    const posts = postsStore.read();
    const quests = questsStore.read();
    const quest = questId ? quests.find(q => q.id === questId) : null;
    const parent = replyTo ? posts.find(p => p.id === replyTo) : null;

    // Validate required links based on post type
    if (type === 'task') {
      const hasProject = linkedItems.some(
        (li: LinkedItem) => li.itemType === 'project'
      );
      if (!hasProject) {
        res.status(400).json({ error: 'Tasks must link to a project' });
        return;
      }
    } else if (type === 'change') {
      const target = linkedItems
        .filter((li: LinkedItem) => li.itemType === 'post')
        .map((li: LinkedItem) => posts.find(p => p.id === li.itemId))
        .find(
          (p: DBPost | undefined) =>
            p && (p.type === 'task' || p.type === 'request')
        );
      if (!target) {
        res.status(400).json({ error: 'Changes must link to a task or request' });
        return;
      }
    } else if (type === 'review') {
      const target = linkedItems
        .filter((li: LinkedItem) => li.itemType === 'post')
        .map((li: LinkedItem) => posts.find(p => p.id === li.itemId))
        .find((p: DBPost | undefined) => p && p.type === 'change');
      if (!target) {
        res.status(400).json({ error: 'Reviews must link to a change' });
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
      ...(type === 'review' && rating ? { rating: Math.min(5, Math.max(0, Number(rating))) } : {}),
      status: finalStatus,
      helpRequest: type === 'request' || helpRequest,
      needsHelp: type === 'request' ? needsHelp ?? true : undefined,
      nodeId: quest ? generateNodeId({ quest, posts, postType: type, parentPost: parent }) : undefined,
      boardId: effectiveBoardId,
    };

    if (type === 'request') {
      const summaryTags = new Set([...(newPost.tags || []), 'summary:request']);
      const linkedPosts = linkedItems
        ?.filter((li: LinkedItem) => li.itemType === 'post')
        .map((li: LinkedItem) => posts.find((p: DBPost) => p.id === li.itemId))
        .filter((p: DBPost | undefined): p is DBPost => !!p);
      if (linkedPosts?.some((p: DBPost) => p.type === 'task')) {
        summaryTags.add('summary:task');
      } else if (linkedPosts?.some((p: DBPost) => p.type === 'change')) {
        summaryTags.add('summary:change');
      }
      newPost.tags = Array.from(summaryTags);
    }

    if (questId && (!newPost.questNodeTitle || newPost.questNodeTitle.trim() === '')) {
      newPost.questNodeTitle = makeQuestNodeTitle(content);
    }

    if (usePg) {
      try {
        await pool.query(
          'INSERT INTO posts (id, authorid, type, content, title) VALUES ($1, $2, $3, $4, $5)',
          [newPost.id, newPost.authorId, newPost.type, newPost.content, newPost.title]
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
        followers.forEach(uid => {
          if (uid === author?.id) return;
          const notes = notificationsStore.read();
          const newNote = {
            id: uuidv4(),
            userId: uid,
            message: `${author?.username || 'Someone'} replied to a post you follow`,
            link: `/posts/${parent.id}`,
            read: false,
            createdAt: new Date().toISOString(),
          };
          notificationsStore.write([...notes, newNote]);
        });
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
  (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
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
      const otherPosts = posts.filter((p) => p.id !== post.id);
      post.nodeId = quest
        ? generateNodeId({
            quest,
            posts: otherPosts,
            postType: post.type,
            parentPost: parent,
          })
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
router.post('/:id/follow', authMiddleware, (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
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
  const notes = notificationsStore.read();
  const newNote = {
    id: uuidv4(),
    userId: post.authorId,
    message: `${follower.username} followed your post`,
    link: `/posts/${post.id}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notificationsStore.write([...notes, newNote]);
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
      visibility: original.visibility,
      questId: original.questId || null,
      tags: [...(original.tags || [])],
      collaborators: [], // reposts are solo unless explicitly assigned
      replyTo: null,
      timestamp: new Date().toISOString(),
      repostedFrom: original.id,
      linkedItems: [...(original.linkedItems || [])],

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
  (req: AuthenticatedRequest<{ id: string; type: string }>, res: Response): void => {
    const { id, type } = req.params;
    const userId = req.user!.id;
    const reactions = reactionsStore.read();
    const key = `${id}_${userId}_${type}`;

    if (!reactions.includes(key)) {
      reactions.push(key);
      reactionsStore.write(reactions);
    }

    res.json({ success: true });
  }
);

//
// ✅ DELETE /api/posts/:id/reactions/:type – Remove reaction
//
router.delete(
  '/:id/reactions/:type',
  authMiddleware,
  (req: AuthenticatedRequest<{ id: string; type: string }>, res: Response): void => {
    const { id, type } = req.params;
    const userId = req.user!.id;
    const reactions = reactionsStore.read();
    const index = reactions.indexOf(`${id}_${userId}_${type}`);

    if (index !== -1) {
      reactions.splice(index, 1);
      reactionsStore.write(reactions);
    }

    res.json({ success: true });
  }
);

//
// ✅ GET /api/posts/:id/reactions – Get all reactions on a post
//
router.get('/:id/reactions', (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const reactions = reactionsStore.read();
  const postReactions = reactions
    .filter((r) => r.startsWith(`${id}_`))
    .map((r) => {
      const [, userId, type] = r.split('_');
      return { userId, type };
    });

  res.json(postReactions);
});

//
// ✅ POST /api/tasks/:id/request-help – Create a help request from a task
//
router.post(
  '/tasks/:id/request-help',
  authMiddleware,
  (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
    const posts = postsStore.read();
    const task = posts.find((p) => p.id === req.params.id && p.type === 'task');
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const requestPost: DBPost = {
      id: uuidv4(),
      authorId: req.user!.id,
      type: 'request',
      content: task.content,
      visibility: task.visibility,
      timestamp: new Date().toISOString(),
      subtype: 'task',
      nodeId: task.nodeId,
      tags: [],
      collaborators: [],
      replyTo: null,
      repostedFrom: null,
      linkedItems: [
        { itemId: task.id, itemType: 'post', linkType: 'reference' },
      ],
      questId: task.questId || null,
      helpRequest: true,
      needsHelp: true,
      boardId: 'quest-board',
    };

    task.helpRequest = true;
    task.needsHelp = true;

    const quests = questsStore.read();
    const quest = task.questId ? quests.find(q => q.id === task.questId) : null;
    const openRoles = [
      ...(task.collaborators || []),
      ...(quest?.collaborators || [])
    ].filter(c => !c.userId);

    const subRequests: DBPost[] = openRoles.map(role => ({
      id: uuidv4(),
      authorId: req.user!.id,
      type: 'request',
      content: `Role needed: ${(role.roles || []).join(', ')}`,
      visibility: task.visibility,
      timestamp: new Date().toISOString(),
      subtype: 'task',
      nodeId: task.nodeId,
      tags: [],
      collaborators: [role],
      replyTo: requestPost.id,
      repostedFrom: null,
      linkedItems: [
        { itemId: task.id, itemType: 'post', linkType: 'reference' },
      ],
      questId: task.questId || null,
      helpRequest: true,
      needsHelp: true,
      boardId: 'quest-board',
    }));

    posts.push(requestPost, ...subRequests);
    postsStore.write(posts);
    const users = usersStore.read();
    res.status(201).json({
      request: enrichPost(requestPost, { users }),
      subRequests: subRequests.map(p => enrichPost(p, { users })),
    });
  }
);

//
// ✅ POST /api/posts/:id/request-help – Create a help request from any post
//
router.post(
  '/:id/request-help',
  authMiddleware,
  (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
    const posts = postsStore.read();
    const original = posts.find((p) => p.id === req.params.id);
    if (!original) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const requestPost: DBPost = {
      id: uuidv4(),
      authorId: req.user!.id,
      type: 'request',
      content: original.content,
      visibility: original.visibility,
      timestamp: new Date().toISOString(),
      subtype: original.type === 'task' ? original.type : undefined,
      nodeId: original.type === 'task' ? original.nodeId : undefined,
      tags: [],
      collaborators: [],
      replyTo: null,
      repostedFrom: null,
      linkedItems: [
        { itemId: original.id, itemType: 'post', linkType: 'reference' },
      ],
      questId: original.questId || null,
      helpRequest: true,
      needsHelp: true,
      boardId: 'quest-board',
    };

    original.helpRequest = true;
    original.needsHelp = true;

    posts.push(requestPost);
    postsStore.write(posts);
    const users = usersStore.read();
    res.status(201).json({
      request: enrichPost(requestPost, { users }),
      subRequests: [],
    });
  }
);

//
// ❌ DELETE /api/posts/:id/request-help – Cancel help request and remove linked request posts
//
router.delete(
  '/:id/request-help',
  authMiddleware,
  (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
    const posts = postsStore.read();
    const post = posts.find(p => p.id === req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const removedIds: string[] = [];
    for (let i = posts.length - 1; i >= 0; i--) {
      const p = posts[i];
      if (
        p.type === 'request' &&
        p.authorId === req.user!.id &&
        p.helpRequest === true &&
        p.linkedItems?.some(
          li => li.itemId === post.id && li.itemType === 'post' && li.linkType === 'reference'
        )
      ) {
        removedIds.push(p.id);
        posts.splice(i, 1);
      }
    }

    post.helpRequest = false;
    post.needsHelp = false;
    postsStore.write(posts);

    res.json({ success: true, removedIds });
  }
);

//
// ✅ POST /api/posts/:id/accept – Accept a help request
// Marks the post as pending for the current user and joins or creates a quest
//
router.post(
  '/:id/accept',
  authMiddleware,
  (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
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

    // Determine if the request links to a task or change
    const linkedPosts = (post.linkedItems || [])
      .filter(li => li.itemType === 'post')
      .map(li => posts.find(p => p.id === li.itemId))
      .filter((p): p is DBPost => !!p);
    const linkedTask = linkedPosts.find(p => p.type === 'task');
    const linkedChange = linkedPosts.find(p => p.type === 'change');

    let created: DBPost | null = null;
    if (linkedChange) {
      created = {
        id: uuidv4(),
        authorId: userId,
        type: 'review',
        title: makeQuestNodeTitle(post.content),
        content: '',
        visibility: 'public',
        timestamp: new Date().toISOString(),
        replyTo: linkedChange.id,
        linkedItems: [
          { itemId: linkedChange.id, itemType: 'post', linkType: 'reference' },
        ],
      } as DBPost;
    } else if (linkedTask) {
      created = {
        id: uuidv4(),
        authorId: userId,
        type: 'change',
        title: makeQuestNodeTitle(post.content),
        content: '',
        visibility: 'public',
        timestamp: new Date().toISOString(),
        replyTo: linkedTask.id,
        linkedItems: [
          { itemId: linkedTask.id, itemType: 'post', linkType: 'reference' },
        ],
      } as DBPost;
    } else {
      created = {
        id: uuidv4(),
        authorId: userId,
        type: 'project',
        title: makeQuestNodeTitle(post.content),
        content: '',
        visibility: 'public',
        timestamp: new Date().toISOString(),
        replyTo: post.id,
      } as DBPost;
    }

    posts.push(created);

    questsStore.write(quests);
    postsStore.write(posts);

    const users = usersStore.read();

    const follower = users.find(u => u.id === req.user!.id);
    if (follower && post.authorId !== follower.id) {
      const notes = notificationsStore.read();
      const newNote = {
        id: uuidv4(),
        userId: post.authorId,
        message: `${follower.username} requested to join your post`,
        link: `/posts/${post.id}`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      notificationsStore.write([...notes, newNote]);
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
  (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
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
        const parentId = parentEdge ? parentEdge.from : quest.headPostId;
        const childEdges = edges.filter(e => e.from === post.id);
        quest.taskGraph = edges.filter(e => e.from !== post.id);
        childEdges.forEach(e => {
          const exists = quest.taskGraph!.some(se => se.from === parentId && se.to === e.to);
          if (!exists) {
            quest.taskGraph!.push({ ...e, from: parentId });
          }
        });
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
  (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
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
  (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
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
        const parentId = parentEdge ? parentEdge.from : quest.headPostId;
        const childEdges = edges.filter(e => e.from === post.id);
        quest.taskGraph = edges.filter(e => e.to !== post.id && e.from !== post.id);
        childEdges.forEach(e => {
          const exists = quest.taskGraph!.some(se => se.from === parentId && se.to === e.to);
          if (!exists) {
            quest.taskGraph!.push({ ...e, from: parentId });
          }
        });
        questsStore.write(quests);
      }
    }

    posts.splice(index, 1);
    postsStore.write(posts);
    res.json({ success: true });
  }
);

//
// ✅ GET /api/posts/:id/linked – Get all posts linked to a post
//
router.get('/:id/linked', (req: Request<{ id: string }>, res: Response) => {
  const posts = postsStore.read();
  const linked = posts.filter((p) =>
    p.linkedItems?.some((item) => item.itemId === req.params.id)
  );
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
      res.json(row);
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
