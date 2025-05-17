import express from 'express';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const QUESTS_FILE = './src/data/quests.json';
const POSTS_FILE = './src/data/posts.json';

const loadQuests = () => JSON.parse(fs.readFileSync(QUESTS_FILE, 'utf8') || '[]');
const saveQuests = (data) => fs.writeFileSync(QUESTS_FILE, JSON.stringify(data, null, 2));
const loadPosts = () => JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8') || '[]');

router.post('/', (req, res) => {
  const { authorId, title, description = '', status = 'active' } = req.body;
  if (!authorId || !title) return res.status(400).json({ error: 'Missing fields' });

  const quests = loadQuests();
  const newQuest = { id: uuidv4(), authorId, title, description, status };
  quests.push(newQuest);
  saveQuests(quests);
  res.status(201).json(newQuest);
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { logId } = req.body;

  const quests = loadQuests();
  const quest = quests.find(q => q.id === id);
  if (!quest) return res.status(404).json({ error: 'Quest not found' });

  quest.logs = quest.logs || [];
  quest.logs.push(logId);
  saveQuests(quests);
  res.json(quest);
});

router.get('/:id', (req, res) => {
  const quests = loadQuests();
  const posts = loadPosts();
  const quest = quests.find(q => q.id === req.params.id);
  if (!quest) return res.status(404).json({ error: 'Quest not found' });

  const logs = posts.filter(p => p.type === 'quest_log' && p.questId === quest.id);
  res.json({ ...quest, logs });
});

export default router;