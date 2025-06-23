import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/authMiddleware';
import authOptional from '../middleware/authOptional';
import { boardsStore, questsStore, postsStore, usersStore, reactionsStore } from '../models/stores';
import { enrichQuest, enrichPost } from '../utils/enrich';
import { generateNodeId } from '../utils/nodeIdUtils';
import { logQuest404 } from '../utils/errorTracker';
import type { Quest, LinkedItem, Visibility, TaskEdge } from '../types/api';
import type { DBQuest, DBPost } from '../types/db';

const makeQuestNodeTitle = (content: string): string => {
  const text = content.trim();
  return text.length <= 50 ? text : text.slice(0, 50) + '…';
};

interface AuthRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: { id: string };
}

const router = express.Router();

// GET top 10 featured quests
router.get('/featured', authOptional, (req: AuthRequest, res: Response) => {
  const { userId } = req.query as { userId?: string };
  const quests = questsStore.read();
  const posts = postsStore.read();

  const popularity = (q: DBQuest) =>
    posts.filter((p) => p.questId === q.id).length + (q.linkedPosts?.length || 0);

  const featured = quests
    .filter(
      (q) => q.visibility === 'public' && q.approvalStatus === 'approved'
    )
    .filter((q) => {
      if (!userId) return true;
      const involved =
        q.authorId === userId ||
        (q.collaborators || []).some((c) => c.userId === userId) ||
        posts.some((p) => p.questId === q.id && p.authorId === userId);
      return !involved;
    })
    .sort((a, b) => popularity(b) - popularity(a))
    .slice(0, 10)
    .map((q) => ({
      ...q,
      popularity: popularity(q),
      gitRepo: q.gitRepo ? { repoUrl: q.gitRepo.repoUrl ?? '', ...q.gitRepo } : undefined,
    }));

  res.json(featured);
});

// GET active quests (optionally excluding a user)
router.get('/active', authOptional, (req: AuthRequest, res: Response) => {
  const { userId } = req.query as { userId?: string };
  const quests = questsStore.read();
  const posts = postsStore.read();

  const active = quests
    .filter((q) => q.status === 'active' && q.visibility === 'public')
    .filter((q) => {
      if (!userId) return true;
      const involved =
        q.authorId === userId ||
        (q.collaborators || []).some((c) => c.userId === userId) ||
        posts.some((p) => p.questId === q.id && p.authorId === userId);
      return !involved;
    })
    .map((q) => ({
      ...q,
      gitRepo: q.gitRepo ? { repoUrl: q.gitRepo.repoUrl ?? '', ...q.gitRepo } : undefined,
    }));

  res.json(active);
});

// GET all quests
router.get('/', (req: Request, res: Response) => {
  const quests: Quest[] = questsStore.read().map((q) => ({
    ...q,
    gitRepo: q.gitRepo ? { repoUrl: q.gitRepo.repoUrl ?? '', ...q.gitRepo } : undefined,
  }));
  res.json(quests);
});

// CREATE a new quest
router.post('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  const {
    title,
    description = '',
    tags = [],
    fromPostId = '',
    headType = 'task',
    taskType = 'folder',
    helpRequest = false,
  } = req.body;

  const authorId = req.user?.id;
  if (!authorId || !title) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const existingQuests = questsStore.read();
  const normalize = (t: string): string => t.replace(/\s+/g, '').toLowerCase();
  const duplicate = existingQuests.some(
    (q) => normalize(q.title) === normalize(title)
  );
  if (duplicate) {
    res.status(400).json({ error: 'Quest title already exists' });
    return;
  }

  const newQuest: Quest = {
    id: uuidv4(),
    authorId,
    title,
    description,
    displayOnBoard: req.body.displayOnBoard ?? true,
    visibility: 'public',
    approvalStatus: 'approved',
    flagCount: 0,
    tags,
    linkedPosts: fromPostId
      ? [{ itemId: fromPostId, itemType: 'post' } satisfies LinkedItem]
      : [],
    collaborators: [],
    status: 'active',
    headPostId: '',
    taskGraph: [],
    helpRequest,
  };

  const posts = postsStore.read();
  const rootContent = `${title}${description ? `\n\n${description}` : ''}`.trim();
  const headPost: DBPost = {
    id: uuidv4(),
    authorId,
    type: headType === 'task' ? 'task' : 'log',
    ...(headType === 'task' ? { taskType } : {}),
    content: rootContent,
    visibility: 'public',
    timestamp: new Date().toISOString(),
    tags: [],
    collaborators: [],
    replyTo: null,
    repostedFrom: null,
    linkedItems: [],
    questId: newQuest.id,
    nodeId: generateNodeId({ quest: newQuest, posts, postType: headType === 'task' ? 'task' : 'log', parentPost: null }),
    questNodeTitle: makeQuestNodeTitle(rootContent),
  };
  posts.push(headPost);
  postsStore.write(posts);

  newQuest.headPostId = headPost.id;

  const quests = questsStore.read();
  const dbQuest = {
    ...newQuest,
    gitRepo: newQuest.gitRepo
      ? {
          repoId: newQuest.gitRepo.repoId,
          repoUrl: newQuest.gitRepo.repoUrl,
          headCommitId: newQuest.gitRepo.headCommitId,
        defaultBranch: newQuest.gitRepo.defaultBranch,
      }
      : undefined,
    helpRequest,
    displayOnBoard: newQuest.displayOnBoard,
  } as DBQuest;
  quests.push(dbQuest);
  questsStore.write(quests);

  // Create default map board for quest
  const boards = boardsStore.read();
  boards.push({
    id: `map-${newQuest.id}`,
    title: `${newQuest.title} Map`,
    description: '',
    boardType: 'map',
    layout: 'graph',
    items: newQuest.headPostId ? [newQuest.headPostId] : [],
    filters: {},
    featured: false,
    createdAt: new Date().toISOString(),
    userId: authorId,
    questId: newQuest.id,
  });
  boardsStore.write(boards);

  res.status(201).json(newQuest);
});

// PATCH quest (e.g. add a log)
router.patch(
  '/:id',
  (
    req: Request<
      { id: string },
      any,
      Partial<Quest> & { itemId?: string }
    >,
    res: Response
  ): void => {
    const { id } = req.params;
    const { itemId, gitRepo, title, description, tags, displayOnBoard } = req.body;

  const quests = questsStore.read();
  const quest = quests.find(q => q.id === id);
  if (!quest) {
    logQuest404(id, req.originalUrl);
    res.status(404).json({ error: 'Quest not found' });
    return;
  }

  if (itemId) {
    const posts = postsStore.read();
    const post = posts.find(p => p.id === itemId);
    if (post && post.type === 'free_speech') {
      post.type = 'quest_log';
      post.subtype = 'comment';
      post.questId = id;
      postsStore.write(posts);
    }

    quest.linkedPosts = quest.linkedPosts || [];
    const exists = quest.linkedPosts.some(l => l.itemId === itemId);
    if (!exists) {
      quest.linkedPosts.push({ itemId, itemType: 'post' });
      if (post && post.type === 'task') {
        quest.taskGraph = quest.taskGraph || [];
        const edgeExists = quest.taskGraph.some(e => e.to === itemId);
        if (!edgeExists) {
          quest.taskGraph.push({ from: quest.headPostId, to: itemId });
        }
      }
    }
  }

  if (title !== undefined) quest.title = title;
  if (description !== undefined) quest.description = description;
  if (tags !== undefined) quest.tags = tags;
  if (displayOnBoard !== undefined) quest.displayOnBoard = displayOnBoard;
  if (gitRepo && typeof gitRepo.repoUrl === 'string') {
    quest.gitRepo = { ...(quest.gitRepo || { repoId: '' }), ...quest.gitRepo, repoUrl: gitRepo.repoUrl } as any;
  }

  questsStore.write(quests);
  res.json(quest);
  }
);

// GET posts linked to a quest
router.get(
  '/:id/posts',
  authOptional,
  (req: AuthRequest<{ id: string }>, res: Response): void => {
    const { id } = req.params;

    const posts = postsStore.read();
    const users = usersStore.read();
    const filtered = posts.filter((p) => p.questId === id);
    res.json(
      filtered.map((p) =>
        enrichPost(p, { users, currentUserId: req.user?.id || null })
      )
    );
  }
);

// POST flag a quest for moderation
router.post('/:id/flag', authMiddleware, (req: AuthRequest<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const quests = questsStore.read();
  const posts = postsStore.read();
  const quest = quests.find(q => q.id === id);
  if (!quest) {
    logQuest404(id, req.originalUrl);
    res.status(404).json({ error: 'Quest not found' });
    return;
  }

  quest.flagCount = (quest.flagCount || 0) + 1;

  if (quest.flagCount >= 3 && quest.approvalStatus === 'approved') {
    quest.approvalStatus = 'flagged';
    const reviewPost: DBPost = {
      id: uuidv4(),
      authorId: req.user!.id,
      type: 'meta_system',
      subtype: 'mod_review',
      content: `Quest ${quest.id} flagged for review`,
      visibility: 'hidden',
      timestamp: new Date().toISOString(),
      tags: ['mod_review'],
      collaborators: [],
      replyTo: null,
      repostedFrom: null,
      linkedItems: [{ itemId: quest.id, itemType: 'quest' }],
    };
    posts.push(reviewPost);
    postsStore.write(posts);
  }

  questsStore.write(quests);
  res.json({ success: true, flags: quest.flagCount });
});

// GET task graph map for a quest
router.get(
  '/:id/map',
  authOptional,
  (req: AuthRequest<{ id: string }>, res: Response): void => {
    const { id } = req.params;
  const quests = questsStore.read();
  const quest = quests.find((q) => q.id === id);
  if (!quest) {
    logQuest404(id, req.originalUrl);
    res.status(404).json({ error: 'Quest not found' });
    return;
  }

    const posts = postsStore.read();
    const users = usersStore.read();
    const nodes = posts
      .filter((p) => p.questId === id)
      .map((p) => enrichPost(p, { users, currentUserId: req.user?.id || null }));

    res.json({ nodes, edges: quest.taskGraph || [] });
  }
);

// PATCH update task graph edges for a quest
router.patch(
  '/:id/map',
  authMiddleware,
  (
    req: AuthRequest<{ id: string }, any, { edges: TaskEdge[] }>,
    res: Response,
  ): void => {
    const { id } = req.params;
    const { edges } = req.body;

    if (!Array.isArray(edges)) {
      res.status(400).json({ error: 'Invalid edges' });
      return;
    }

    const quests = questsStore.read();
    const quest = quests.find((q) => q.id === id);
    if (!quest) {
      logQuest404(id, req.originalUrl);
      res.status(404).json({ error: 'Quest not found' });
      return;
    }

    quest.taskGraph = edges;
    questsStore.write(quests);

    res.json({ success: true, edges: quest.taskGraph });
  },
);

// GET enriched quest
router.get(
  '/:id',
  authOptional,
  async (
    req: AuthRequest<{ id: string }, any, any, { enrich?: string }>,
    res: Response
  ): Promise<void> => {
    const { id } = req.params;
    const { enrich } = req.query;
    const userId = req.user?.id || null;

  const quests = questsStore.read();
  const quest = quests.find((q) => q.id === id);
  if (!quest) {
    logQuest404(id, req.originalUrl);
    res.status(404).json({ error: 'Quest not found' });
    return;
  }

    if (enrich === 'true') {
      const posts = postsStore.read();
      const users = usersStore.read();
      const enriched = enrichQuest(quest, { posts, users, currentUserId: userId });
      res.json(enriched);
      return;
    }

    res.json(quest);
  }
);

// POST to link a post to quest
router.post(
  '/:id/link',
  authMiddleware,
  (
    req: AuthRequest<
      { id: string },
      any,
      {
        postId: string;
        parentId?: string;
        edgeType?: 'sub_problem' | 'solution_branch' | 'folder_split';
        edgeLabel?: string;
        title?: string;
      }
    >,
    res: Response
  ) => {
  const { id } = req.params;
  const { postId, parentId, edgeType, edgeLabel, title } = req.body;
  if (!postId) {
    res.status(400).json({ error: 'Missing postId' });
    return;
  }

  const quests = questsStore.read();
  const quest = quests.find(q => q.id === id);
  if (!quest) {
    logQuest404(id, req.originalUrl);
    res.status(404).json({ error: 'Quest not found' });
    return;
  }

  const posts = postsStore.read();
  const post = posts.find(p => p.id === postId);
  if (post && post.type === 'free_speech') {
    post.type = 'quest_log';
    post.subtype = 'comment';
    post.questId = id;
    postsStore.write(posts);
  }
  if (post && parentId) {
    post.linkedNodeId = parentId;
    postsStore.write(posts);
  }

  quest.linkedPosts = quest.linkedPosts || [];
  const alreadyLinked = quest.linkedPosts.some(p => p.itemId === postId);
  if (!alreadyLinked) {
    quest.linkedPosts.push({ itemId: postId, itemType: 'post', title });
    if (post && post.type === 'task') {
      quest.taskGraph = quest.taskGraph || [];
      const from = parentId || quest.headPostId;
      const edgeExists = quest.taskGraph.some(
        e => e.to === postId && e.from === from
      );
      if (!edgeExists) {
        quest.taskGraph.push({ from, to: postId, type: edgeType, label: edgeLabel });
      }
    }
    questsStore.write(quests);
  }

  res.json(quest);
});

// POST add a collaborator or open role
router.post(
  '/:id/collaborators',
  authMiddleware,
  (req: AuthRequest<{ id: string }, any, { userId?: string; roles?: string[] }>, res: Response): void => {
    const { id } = req.params;
    const { userId, roles = [] } = req.body;

  const quests = questsStore.read();
  const users = usersStore.read();
  const quest = quests.find(q => q.id === id);
  if (!quest) {
    logQuest404(id, req.originalUrl);
    res.status(404).json({ error: 'Quest not found' });
    return;
  }

    if (userId && !users.find(u => u.id === userId)) {
      res.status(400).json({ error: 'User not found' });
      return;
    }

    quest.collaborators = quest.collaborators || [];
    quest.collaborators.push({ userId, roles });
    questsStore.write(quests);

    res.json(quest);
  }
);

// GET quest tree (hierarchy)
router.get(
  '/:id/tree',
  authOptional,
  (req: Request<{ id: string }>, res: Response): void => {
  const { id } = req.params;

  const quests = questsStore.read();
  const posts = postsStore.read();
  const quest = quests.find(q => q.id === id);
  if (!quest) {
    logQuest404(id, req.originalUrl);
    res.status(404).json({ error: 'Quest not found' });
    return;
  }

  const nodes: any[] = [];

  const recurse = (questId: string) => {
    const q = quests.find(x => x.id === questId);
    if (q) {
      nodes.push({ ...q, type: 'quest' });
      q.linkedPosts
        .filter(l => l.itemType === 'quest')
        .forEach(l => recurse(l.itemId));
    }

    const postChildren = posts.filter(p => p.questId === questId && p.type === 'task');
    postChildren.forEach(p => nodes.push({ ...p, type: 'post' }));
  };

  recurse(id);
  res.json(nodes);
});

// POST mark quest complete and cascade solution
router.post(
  '/:id/complete',
  authMiddleware,
  (req: AuthRequest<{ id: string }>, res: Response): void => {
    const { id } = req.params;

    const quests = questsStore.read();
    const posts = postsStore.read();

    const visited = new Set<string>();

    const markCompleted = (questId: string): void => {
      if (visited.has(questId)) return;
      visited.add(questId);

      const quest = quests.find((q) => q.id === questId);
      if (!quest) return;

      quest.status = 'completed';

      (quest.linkedPosts || []).forEach((link) => {
        if (link.itemType === 'post') {
          const post = posts.find((p) => p.id === link.itemId);
          if (post && link.cascadeSolution) {
            post.tags = Array.from(new Set([...(post.tags || []), 'solved']));
          }
          if (link.notifyOnChange) {
            console.log(
              `Notify link change for post ${link.itemId} from quest ${questId}`
            );
          }
        } else if (link.itemType === 'quest') {
          if (link.cascadeSolution) {
            markCompleted(link.itemId);
          } else if (link.notifyOnChange) {
            console.log(
              `Notify link change for quest ${link.itemId} from quest ${questId}`
            );
          }
        }
      });
    };

    const quest = quests.find((q) => q.id === id);
    if (!quest) {
      logQuest404(id, req.originalUrl);
      res.status(404).json({ error: 'Quest not found' });
      return;
    }

    markCompleted(id);

    questsStore.write(quests);
    postsStore.write(posts);

    res.json(quest);
  }
);

// PATCH quest visibility or approval status by moderators
router.patch(
  '/:id/moderate',
  authMiddleware,
  (req: AuthRequest<{ id: string }, any, { visibility?: Visibility; approvalStatus?: 'approved' | 'flagged' | 'banned' }>, res: Response) => {
    const { id } = req.params;
    const { visibility, approvalStatus } = req.body;
    const quests = questsStore.read();
    const users = usersStore.read();
    const quest = quests.find(q => q.id === id);
    if (!quest) {
      logQuest404(id, req.originalUrl);
      res.status(404).json({ error: 'Quest not found' });
      return;
    }

    const user = users.find(u => u.id === req.user!.id);
    if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (visibility) quest.visibility = visibility;
    if (approvalStatus) quest.approvalStatus = approvalStatus as any;

    questsStore.write(quests);
    res.json(quest);
  }
);

// POST /quests/:id/archive - archive quest and posts without reactions
router.post(
  '/:id/archive',
  authMiddleware,
  (req: AuthRequest<{ id: string }>, res: Response): void => {
    const { id } = req.params;
    const quests = questsStore.read();
    const quest = quests.find(q => q.id === id);
    if (!quest) {
      logQuest404(id, req.originalUrl);
      res.status(404).json({ error: 'Quest not found' });
      return;
    }

    quest.tags = Array.from(new Set([...(quest.tags || []), 'archived']));

    const posts = postsStore.read();
    const reactions = reactionsStore.read();
    posts.forEach(p => {
      if (p.questId === id && !reactions.some(r => r.startsWith(`${p.id}_`))) {
        p.tags = Array.from(new Set([...(p.tags || []), 'archived']));
      }
    });
    questsStore.write(quests);
    postsStore.write(posts);

    res.json({ success: true });
  }
);

// DELETE /quests/:id/archive - unarchive quest and posts
router.delete(
  '/:id/archive',
  authMiddleware,
  (req: AuthRequest<{ id: string }>, res: Response): void => {
    const { id } = req.params;
    const quests = questsStore.read();
    const quest = quests.find(q => q.id === id);
    if (!quest) {
      logQuest404(id, req.originalUrl);
      res.status(404).json({ error: 'Quest not found' });
      return;
    }

    quest.tags = (quest.tags || []).filter(t => t !== 'archived');
    const posts = postsStore.read();
    posts.forEach(p => {
      if (p.questId === id) {
        p.tags = (p.tags || []).filter(t => t !== 'archived');
      }
    });
    questsStore.write(quests);
    postsStore.write(posts);

    res.json({ success: true });
  }
);

// DELETE quest
router.delete(
  '/:id',
  authMiddleware,
  (req: AuthRequest<{ id: string }>, res: Response): void => {
  const { id } = req.params;
  const quests = questsStore.read();
  const index = quests.findIndex(q => q.id === id);

  if (index === -1) {
    logQuest404(id, req.originalUrl);
    res.status(404).json({ error: 'Quest not found' });
    return;
  }

  const questsStorePosts = postsStore.read();
  const reactions = reactionsStore.read();

  const questPosts = questsStorePosts.filter(p => p.questId === id);
  const postsToKeep = new Set(
    questPosts
      .filter(p => reactions.some(r => r.startsWith(`${p.id}_`)))
      .map(p => p.id)
  );
  const remainingPosts = questsStorePosts.filter(
    p => !(p.questId === id && !postsToKeep.has(p.id))
  );
  postsStore.write(remainingPosts);

  quests.splice(index, 1);
  questsStore.write(quests);
  res.json({ success: true, removedPosts: questPosts.length - postsToKeep.size });
});

export default router;
