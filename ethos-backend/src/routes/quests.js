import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import authMiddleware from '../middleware/authMiddleware.js';
import authOptional from '../middleware/authOptional.js';
import { questsStore, postsStore, usersStore } from '../utils/loaders.js';
import { enrichQuest } from '../utils/enrich.js';

const router = express.Router();

// GET all quests (basic list for now)
router.get('/', (req, res) => {
  const quests = questsStore.read();
  res.json(quests);
});

// CREATE new quest
router.post('/', authMiddleware, (req, res) => {
  const { title, description = '', status = 'active', linkedPostId } = req.body;
  const authorId = req.user?.id;

  if (!authorId || !title) {
    return res.status(400).json({ error: 'Missing title or author' });
  }

  const quests = questsStore.read();
  const newQuest = {
    id: uuidv4(),
    authorId,
    title,
    description,
    status,
    logs: [],
    tasks: [],
    linkedPostIds: linkedPostId ? [linkedPostId] : [],
    collaborators: []
  };

  quests.push(newQuest);
  questsStore.write(quests);
  res.status(201).json(newQuest);
});

// LINK post to quest
router.post('/:id/link', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { postId } = req.body;
  if (!postId) return res.status(400).json({ error: 'Missing postId' });

  const quests = questsStore.read();
  const quest = quests.find(q => q.id === id);
  if (!quest) return res.status(404).json({ error: 'Quest not found' });

  quest.linkedPostIds = quest.linkedPostIds || [];
  if (!quest.linkedPostIds.includes(postId)) {
    quest.linkedPostIds.push(postId);
    questsStore.write(quests);
  }

  res.json(quest);
});

// GET quest tree (subtasks or hierarchy)
router.get('/:id/tree', authOptional, (req, res) => {
  const { id } = req.params;

  const quests = questsStore.read();
  const posts = postsStore.read();
  const quest = quests.find(q => q.id === id);
  if (!quest) return res.status(404).json({ error: 'Quest not found' });

  // Collect subtasks and linked post objects
  const nodes = [];

  const recurse = (qid) => {
    const q = quests.find(x => x.id === qid);
    if (q) {
      nodes.push({ ...q, type: 'quest' });
      (q.tasks || []).forEach(childId => recurse(childId));
    }

    const postChildren = posts.filter(p => p.questId === qid && p.type === 'quest_task');
    postChildren.forEach(p => nodes.push({ ...p, type: 'post' }));
  };

  recurse(id);

  res.json(nodes);
});

// ADD a log ID to quest
router.patch('/:id', (req, res) => {
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

// GET single quest (optionally enriched)
router.get('/:id', authOptional, (req, res) => {
  const { id } = req.params;
  const { enrich } = req.query;
  const userId = req.user?.id || null; // populated via authOptional if needed

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

export default router;