import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/authMiddleware';
import authOptional from '../middleware/authOptional';
import { questsStore, postsStore, usersStore } from '../models/stores';
import { enrichQuest } from '../utils/enrich';
import type { Quest, LinkedItem, Post } from '../types/api';

interface AuthRequest extends Request {
  user?: { id: string };
}

const router = express.Router();

// GET all quests
router.get('/', (req: Request, res: Response) => {
  const quests: Quest[] = questsStore.read();
  res.json(quests);
});

// CREATE a new quest
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const {
    title,
    description = '',
    tags = [],
    repoUrl = '',
    assignedRoles = [],
    fromPostId = '',
  } = req.body;

  const authorId = req.user?.id;
  if (!authorId || !title) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newQuest: Quest = {
    id: uuidv4(),
    authorId,
    title,
    description,
    tags,
    repoUrl, // Object literal may only specify known properties, and 'repoUrl' does not exist in type 'Quest'.
    assignedRoles,
    linkedPosts: fromPostId
      ? [{ itemId: fromPostId, itemType: 'post' } satisfies LinkedItem]
      : [],
    logs: [],
    tasks: [],
    collaborators: [],
    status: 'active',
    headPostId: fromPostId || '',
  };

  const quests = questsStore.read();
  quests.push(newQuest);
  questsStore.write(quests);

  res.status(201).json(newQuest);
});

// PATCH quest (e.g. add a log)
router.patch('/:id', (req: Request, res: Response) => { //TODO: No overload matches this call.
  const { id } = req.params;
  const { logId } = req.body;

  const quests = questsStore.read();
  const quest = quests.find(q => q.id === id);
  if (!quest) return res.status(404).json({ error: 'Quest not found' });

  quest.logs = quest.logs || [];
  if (!quest.logs.includes(logId)) {
    quest.logs.push(logId);
    questsStore.write(quests);
  }

  res.json(quest);
});

// GET enriched quest
router.get('/:id', authOptional, async (req: AuthRequest, res: Response) => { //TODO: No overload matches this call.
  const { id } = req.params;
  const { enrich } = req.query;
  const userId = req.user?.id || null;

  const quests = questsStore.read();
  const quest = quests.find(q => q.id === id);
  if (!quest) return res.status(404).json({ error: 'Quest not found' });

  if (enrich === 'true') {
    const posts = postsStore.read();
    const users = usersStore.read();
    const enriched = enrichQuest(quest, { posts, users, currentUserId: userId });
    return res.json(enriched);
  }

  res.json(quest);
});

// POST to link a post to quest
router.post('/:id/link', authMiddleware, (req: AuthRequest, res: Response) => { //TODO: No overload matches this call.
  const { id } = req.params;
  const { postId } = req.body;
  if (!postId) return res.status(400).json({ error: 'Missing postId' });

  const quests = questsStore.read();
  const quest = quests.find(q => q.id === id);
  if (!quest) return res.status(404).json({ error: 'Quest not found' });

  quest.linkedPosts = quest.linkedPosts || [];
  const alreadyLinked = quest.linkedPosts.some(p => p.itemId === postId);
  if (!alreadyLinked) {
    quest.linkedPosts.push({ itemId: postId, itemType: 'post' });
    questsStore.write(quests);
  }

  res.json(quest);
});

// GET quest tree (hierarchy)
router.get('/:id/tree', authOptional, (req: Request, res: Response) => { //TODO: No overload matches this call.
  const { id } = req.params;

  const quests = questsStore.read();
  const posts = postsStore.read();
  const quest = quests.find(q => q.id === id);
  if (!quest) return res.status(404).json({ error: 'Quest not found' });

  const nodes: any[] = [];

  const recurse = (questId: string) => {
    const q = quests.find(x => x.id === questId);
    if (q) {
      nodes.push({ ...q, type: 'quest' });
      (q.tasks || []).forEach(childId => recurse(childId)); //todo: Parameter 'childId' implicitly has an 'any' type.t ecurse = (questId: string) => {
    }

    const postChildren = posts.filter(p => p.questId === questId && p.type === 'task');
    postChildren.forEach(p => nodes.push({ ...p, type: 'post' }));
  };

  recurse(id);
  res.json(nodes);
});

// DELETE quest
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => { //TODO: No overload matches this call.
  const { id } = req.params;
  const quests = questsStore.read();
  const index = quests.findIndex(q => q.id === id);

  if (index === -1) return res.status(404).json({ error: 'Quest not found' });

  quests.splice(index, 1);
  questsStore.write(quests);
  res.json({ success: true });
});

export default router;