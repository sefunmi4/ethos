import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/authMiddleware';
import { boardsStore, postsStore, questsStore, usersStore } from '../models/stores';
import { enrichBoard } from '../utils/enrich';
import type { BoardData, AuthenticatedRequest } from '../types/api';

const router = express.Router();

//
// ✅ GET all boards (?featured=true, ?enrich=true)
//
router.get(
  '/',
  (
    req: Request<{}, BoardData[], undefined, { featured?: string; enrich?: string }>,
    res: Response
  ): void => {
    const { featured, enrich } = req.query;
    const boards = boardsStore.read();
    const posts = postsStore.read();
    const quests = questsStore.read();
    const users = usersStore.read();

    let result: BoardData[] = boards;

    if (enrich === 'true') {
      result = boards.map(board => {
        const enriched = enrichBoard(board, { posts, users, quests });
        return {
          ...enriched,
          structure: board.structure ?? 'grid',
          items: board.items,
          enrichedItems: enriched.enrichedItems,
        };
      });
    }

    if (featured === 'true') {
      result = result.filter(board => board.featured);
    }

    res.json(result);
  }
);

//
// ✅ GET default board by context (e.g., /default/home?enrich=true)
//
router.get(
  '/default/:context',
  (
    req: Request<{ context: string }, BoardData | { error: string }, undefined, { enrich?: string }>,
    res: Response
  ): void => {
    const { context } = req.params;
    const { enrich } = req.query;

    const boards = boardsStore.read();
    const posts = postsStore.read();
    const quests = questsStore.read();
    const users = usersStore.read();

    const board = boards.find((b) => b.defaultFor === context);
    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    let result: BoardData = board;

    if (enrich === 'true') {
      const enriched = enrichBoard(board, { posts, users, quests });
      result = {
        ...enriched,
        structure: board.structure ?? 'grid',
      };
    }

    res.json(result);
  }
);

//
// ✅ GET a single board by ID
//
router.get(
  '/:id',
  (
    req: Request<{ id: string }, BoardData | { error: string }, undefined, { enrich?: string }>,
    res: Response
  ): void => {
    const { id } = req.params;
    const { enrich } = req.query;

    const boards = boardsStore.read();
    const posts = postsStore.read();
    const users = usersStore.read();
    const quests = questsStore.read();

    const board = boards.find(b => b.id === id);
    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    let result: BoardData = board;
    if (enrich === 'true') {
      const enriched = enrichBoard(board, { posts, users, quests });
      result = { ...enriched, structure: board.structure ?? 'grid' };
    }

    res.json(result);
  }
);

//
// ✅ GET all items from a board (posts/quests)
//
router.get(
  '/:id/items',
  (req: Request<{ id: string }>, res: Response): void => {
    const { id } = req.params;
    const boards = boardsStore.read();
    const posts = postsStore.read();
    const quests = questsStore.read();

    const board = boards.find(b => b.id === id);
    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    const items = board.items
      .map(itemId => posts.find(p => p.id === itemId) || quests.find(q => q.id === itemId))
      .filter(Boolean);

    res.json(items);
  }
);

//
// ✅ POST create a new board
//
router.post(
  '/',
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    const {
      title,
      description = '',
      itemType = 'post',
      items = [],
      filterTags = {},
      featured = false,
      defaultFor = null,
      structure = 'grid'
    } = req.body;

    const boards = boardsStore.read();
    const newBoard: BoardData = {
      id: uuidv4(),
      title,
      description,
      itemType,
      items,
      filterTags,
      featured,
      defaultFor,
      structure,
      createdAt: new Date().toISOString(),
      createdBy: req.user as string
    };

    boards.push(newBoard);
    boardsStore.write(boards);
    res.status(201).json(newBoard);
  }
);

//
// ✅ PATCH update board
//
router.patch(
  '/:id',
  authMiddleware,
  (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
    const boards = boardsStore.read();
    const board = boards.find(b => b.id === req.params.id);
    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    Object.assign(board, req.body);
    boardsStore.write(boards);
    res.json(board);
  }
);

//
// ✅ POST remove an item from board
//
router.post(
  '/:id/remove',
  authMiddleware,
  (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
    const { itemId } = req.body;
    const boards = boardsStore.read();
    const board = boards.find(b => b.id === req.params.id);
    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    board.items = board.items.filter(id => id !== itemId);
    boardsStore.write(boards);
    res.json({ success: true });
  }
);

//
// ✅ DELETE board
//
router.delete(
  '/:id',
  authMiddleware,
  (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
    const boards = boardsStore.read();
    const index = boards.findIndex(b => b.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    const [removed] = boards.splice(index, 1);
    boardsStore.write(boards);
    res.json(removed);
  }
);

export default router;