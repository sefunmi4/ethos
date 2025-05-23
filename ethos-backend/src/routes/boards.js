import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import authMiddleware from '../middleware/authMiddleware.js';
import { boardsStore } from '../utils/loaders.js';

const router = express.Router();

// GET all boards or featured
router.get('/', (req, res) => {
  const { featured } = req.query;
  const boards = boardsStore.read();
  if (featured === 'true') {
    return res.json(boards.filter(b => b.featured));
  }
  res.json(boards);
});

// GET default board for a context
router.get('/default/:context', (req, res) => {
  const boards = boardsStore.read();
  const { context } = req.params;
  const found = boards.find(b => b.defaultFor === context);
  if (!found) return res.status(404).json({ error: 'Board not found' });
  res.json(found);
});

// GET board by ID
router.get('/:id', (req, res) => {
  const boards = boardsStore.read();
  const board = boards.find(b => b.id === req.params.id);
  if (!board) return res.status(404).json({ error: 'Board not found' });
  res.json(board);
});

// POST create a board
router.post('/', authMiddleware, (req, res) => {
  const { title, description = '', type = 'post', items = [], filters = {}, featured = false, defaultFor = null } = req.body;
  const boards = boardsStore.read();

  const newBoard = {
    id: uuidv4(),
    title,
    description,
    type,
    items,
    filters,
    featured,
    defaultFor,
    createdAt: new Date().toISOString()
  };

  boards.push(newBoard);
  boardsStore.write(boards);
  res.status(201).json(newBoard);
});

// PATCH update a board
router.patch('/:id', authMiddleware, (req, res) => {
  const boards = boardsStore.read();
  const board = boards.find(b => b.id === req.params.id);
  if (!board) return res.status(404).json({ error: 'Board not found' });

  const { title, description, type, items, filters, featured, defaultFor } = req.body;
  if (title !== undefined) board.title = title;
  if (description !== undefined) board.description = description;
  if (type !== undefined) board.type = type;
  if (items !== undefined) board.items = items;
  if (filters !== undefined) board.filters = filters;
  if (featured !== undefined) board.featured = featured;
  if (defaultFor !== undefined) board.defaultFor = defaultFor;

  boardsStore.write(boards);
  res.json(board);
});

export default router;
