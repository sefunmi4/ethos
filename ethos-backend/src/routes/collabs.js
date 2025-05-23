import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import authMiddleware from '../middleware/authMiddleware.js';
import { collabStore, questsStore } from '../utils/loaders.js';

const router = express.Router();

// GET all current collaborations
router.get('/', (req, res) => {
  const collabs = collabStore.read();
  res.json(collabs);
});

// POST to join a quest
router.post('/join/:questId', authMiddleware, (req, res) => {
  const userId = req.user?.id;
  const { questId } = req.params;
  const quests = questsStore.read();
  const quest = quests.find(q => q.id === questId);

  if (!quest) return res.status(404).json({ error: 'Quest not found' });
  if (!quest.collaborators) quest.collaborators = [];
  if (!quest.collaborators.includes(userId)) {
    quest.collaborators.push(userId);
    questsStore.write(quests);
  }

  res.json({ message: 'Joined quest', quest });
});

// POST to leave a quest
router.post('/leave/:questId', authMiddleware, (req, res) => {
  const userId = req.user?.id;
  const { questId } = req.params;
  const quests = questsStore.read();
  const quest = quests.find(q => q.id === questId);

  if (!quest) return res.status(404).json({ error: 'Quest not found' });
  if (!quest.collaborators) quest.collaborators = [];
  quest.collaborators = quest.collaborators.filter(id => id !== userId);
  questsStore.write(quests);

  res.json({ message: 'Left quest', quest });
});

export default router;
