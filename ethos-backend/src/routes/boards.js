import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import authMiddleware from '../middleware/authMiddleware.js';
import { boardsStore, postsStore, usersStore } from '../utils/loaders.js';
import { enrichBoard } from '../utils/enrich.js';

const router = express.Router();

// ✅ GET all boards (optionally filtered by ?featured and/or ?enrich=true)
router.get('/', (req, res) => {
  const { featured, enrich } = req.query;

  const boards = boardsStore.read();
  const posts = postsStore.read();
  const users = usersStore.read();

  let result = boards;

  if (enrich === 'true') {
    result = boards.map(board => enrichBoard(board, { posts, users }));
  }

  if (featured === 'true') {
    result = result.filter(board => board.featured);
  }

  res.json(result);
});

// ✅ GET default board for a context (e.g., "home", "profile")
router.get('/default/:context', (req, res) => {
  const { context } = req.params;
  const { enrich } = req.query;

  const boards = boardsStore.read();
  const posts = postsStore.read();
  const users = usersStore.read();

  const board = boards.find(b => b.defaultFor === context);
  if (!board) return res.status(404).json({ error: 'Board not found' });

  let result = board;

  if (enrich === 'true') {
    const enriched = enrichBoard(board, { posts, users });
    result = {
      ...enriched,
      structure: board.structure || 'grid', // fallback
      title: board.title,
      id: board.id,
    };
  }

  res.json(result);
});

// ✅ GET board by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const { enrich } = req.query;

  const boards = boardsStore.read();
  const posts = postsStore.read();
  const users = usersStore.read();

  const board = boards.find(b => b.id === id);
  if (!board) return res.status(404).json({ error: 'Board not found' });

  let result = board;

  if (enrich === 'true') {
    const enriched = enrichBoard(board, { posts, users });
    result = {
      ...enriched,
      structure: board.structure || 'grid', // fallback
      title: board.title,
      id: board.id,
    };
  }

  res.json(result);
});

// ✅ POST create a new board
router.post('/', authMiddleware, (req, res) => {
  const {
    title,
    description = '',
    type = 'post',
    items = [],
    filters = {},
    featured = false,
    defaultFor = null,
    structure = 'grid' // 👈 add default structure type
  } = req.body;

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
    structure, // 👈 include in board object
    createdAt: new Date().toISOString()
  };

  boards.push(newBoard);
  boardsStore.write(boards);
  res.status(201).json(newBoard);
});

// ✅ PATCH update an existing board
router.patch('/:id', authMiddleware, (req, res) => {
  const boards = boardsStore.read();
  const board = boards.find(b => b.id === req.params.id);
  if (!board) return res.status(404).json({ error: 'Board not found' });

  const {
    title,
    description,
    type,
    items,
    filters,
    featured,
    defaultFor
  } = req.body;

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

router.delete('/:id', authMiddleware, (req, res) => {
  const boards = boardsStore.read();
  const index = boards.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Board not found' });

  const [removed] = boards.splice(index, 1);
  boardsStore.write(boards);
  res.json(removed);
});rreddffrederdfredfeeerdre

export default router;