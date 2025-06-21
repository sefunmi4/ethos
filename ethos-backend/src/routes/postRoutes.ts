import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/authMiddleware';
import authOptional from '../middleware/authOptional';
import { postsStore, usersStore, reactionsStore, questsStore } from '../models/stores';
import { enrichPost } from '../utils/enrich';
import { generateNodeId } from '../utils/nodeIdUtils';
import type { DBPost } from '../types/db';
import type { AuthenticatedRequest } from '../types/express';

const makeQuestNodeTitle = (content: string): string => {
  const text = content.trim();
  // TODO: Replace simple truncation with AI-generated summaries
  return text.length <= 50 ? text : text.slice(0, 50) + '…';
};

const router = express.Router();

//
// ✅ GET all posts
//
router.get('/', authOptional, (_req: Request, res: Response): void => {
  const posts = postsStore.read();
  const users = usersStore.read();
  res.json(posts.map((p) => enrichPost(p, { users, currentUserId: (_req as any).user?.id || null })));
});

// GET recent posts (optionally excluding a user)
router.get('/recent', authOptional, (req: Request<{}, any, any, { userId?: string; hops?: string }>, res: Response): void => {
  const { userId } = req.query;
  const posts = postsStore.read();
  const users = usersStore.read();
  const recent = posts
    .filter((p) =>
      p.visibility === 'public' ||
      p.visibility === 'request_board' ||
      p.needsHelp === true
    )
    .filter((p) => (userId ? p.authorId !== userId : true))
    .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
    .slice(0, 20)
    .map((p) => enrichPost(p, { users, currentUserId: userId || null }));

  res.json(recent);
});

//
// ✅ GET a single post by ID
//

//
// ✅ POST create a new post
//
router.post(
  '/',
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    const {
      type = 'free_speech',
      content = '',
      details = '',
      visibility = 'public',
      tags = [],
      questId = null,
      replyTo = null,
      linkedItems = [],
      collaborators = [],
      status,
      boardId,
      taskType = 'abstract',
      helpRequest = false,
      needsHelp = undefined,
    } = req.body;

    const finalStatus = status ?? (type === 'task' ? 'To Do' : undefined);

    const posts = postsStore.read();
    const quests = questsStore.read();
    const quest = questId ? quests.find(q => q.id === questId) : null;
    const parent = replyTo ? posts.find(p => p.id === replyTo) : null;

    if (
      boardId === 'quest-board' &&
      !(type === 'request' || helpRequest === true)
    ) {
      res
        .status(400)
        .json({ error: 'Only help requests allowed on this board' });
      return;
    }

    const newPost: DBPost = {
      id: uuidv4(),
      authorId: req.user!.id,
      type,
      content,
      details,
      visibility,
      timestamp: new Date().toISOString(),
      tags,
      collaborators,
      replyTo,
      repostedFrom: null,
      linkedItems,
      questId,
      ...(type === 'task' ? { taskType } : {}),
      status: finalStatus,
      helpRequest: type === 'request' || helpRequest,
      needsHelp: type === 'request' ? needsHelp ?? true : undefined,
      nodeId: quest ? generateNodeId({ quest, posts, postType: type, parentPost: parent }) : undefined,
    };

    if (questId && (!newPost.questNodeTitle || newPost.questNodeTitle.trim() === '')) {
      newPost.questNodeTitle = makeQuestNodeTitle(content);
    }

    posts.push(newPost);
    postsStore.write(posts);

    if (questId && type === 'task') {
      const quest = quests.find((q) => q.id === questId);
      if (quest) {
        quest.taskGraph = quest.taskGraph || [];
        const from = quest.headPostId || '';
        const exists = quest.taskGraph.some(
          (e) => e.from === from && e.to === newPost.id
        );
        if (!exists) {
          quest.taskGraph.push({ from, to: newPost.id });
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

  const originalQuestId = post.questId;
  const originalReplyTo = post.replyTo;
  const originalType = post.type;

  Object.assign(post, req.body);

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
    };

    posts.push(requestPost);
    postsStore.write(posts);
    const users = usersStore.read();
    res.status(201).json(enrichPost(requestPost, { users }));
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
router.get('/:id', authOptional, (req: Request<{ id: string }>, res: Response): void => {
  const posts = postsStore.read();
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }
  const users = usersStore.read();
  res.json(enrichPost(post, { users, currentUserId: (req as any).user?.id || null }));
});

export default router;
