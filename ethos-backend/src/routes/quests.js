import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import authMiddleware from '../middleware/authMiddleware.js';
import { questsStore, postsStore } from '../utils/loaders.js';

const router = express.Router();

router.get('/', (req, res) => {
  const quests = questsStore.read();
  res.json(quests);
});

router.post('/', authMiddleware, (req, res) => {
  const { title, description = '', status = 'active', linkedPostId } = req.body;
  const authorId = req.user?.id;

  if (!authorId || !title) return res.status(400).json({ error: 'Missing fields' });

  const quests = questsStore.read();
  const newQuest = {
    id: uuidv4(),
    authorId,
    title,
    description,
    status,
    logs: [],
    tasks: [],
    linkedPostIds: linkedPostId ? [linkedPostId] : []
  };

  quests.push(newQuest);
  questsStore.write(quests);
  res.status(201).json(newQuest);
});

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
  }

  questsStore.write(quests);
  res.json(quest);
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { logId } = req.body;

  const quests = questsStore.read();
  const quest = quests.find(q => q.id === id);
  if (!quest) return res.status(404).json({ error: 'Quest not found' });

  quest.logs = quest.logs || [];
  quest.logs.push(logId);
  questsStore.write(quests);
  res.json(quest);
});

router.get('/:id', (req, res) => {
  const quests = questsStore.read();
  const posts = postsStore.read();
  const quest = quests.find(q => q.id === req.params.id);
  if (!quest) return res.status(404).json({ error: 'Quest not found' });

  const logs = posts.filter(p => p.type === 'quest_log' && p.questId === quest.id);
  res.json({ ...quest, logs });
});

export default router;
