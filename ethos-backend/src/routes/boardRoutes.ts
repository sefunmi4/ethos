import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logBoardAction } from '../utils/boardLogger';
import { authMiddleware } from '../middleware/authMiddleware';
import { boardsStore, postsStore, questsStore, usersStore } from '../models/stores';
import { enrichBoard, enrichQuest } from '../utils/enrich';
import { DEFAULT_PAGE_SIZE } from '../constants';
import type { BoardData } from '../types/api';
import type { EnrichedBoard } from '../types/enriched';
import type { AuthenticatedRequest } from '../types/express';

const router = express.Router();

//
// ✅ GET all boards (?featured=true, ?enrich=true)
//
router.get(
  '/',
  (
    req: Request<{}, BoardData[], undefined, { featured?: string; enrich?: string; userId?: string }>,
    res: Response
  ): void => {
    const { featured, enrich, userId } = req.query;
    const boards = boardsStore.read();
    const posts = postsStore.read();
    const quests = questsStore.read();

    let result: (BoardData | EnrichedBoard)[] = boards.map(board => {
      if (userId && board.id === 'my-posts') {
        const filtered = posts
          .filter(p => p.authorId === userId)
          .map(p => p.id);
        return { ...board, items: filtered };
      }

      if (userId && board.id === 'my-quests') {
        const filtered = quests
          .filter(q => q.authorId === userId)
          .map(q => q.id);
        return { ...board, items: filtered };
      }

      return board;
    });

    if (enrich === 'true') {
      result = (result as BoardData[]).map((board) => {
        const enriched = enrichBoard(board, { posts, quests });
        return {
          ...enriched,
          layout: board.layout ?? 'grid',
          items: board.items,
          enrichedItems: enriched.enrichedItems,
        } as EnrichedBoard;
      });
    }

    if (featured === 'true') {
      result = result.filter(board => board.featured === true); 
    }

  res.json(result);
  }
);

//
// ✅ GET thread board for a post
//
router.get(
  '/thread/:postId',
  (
    req: Request<{ postId: string }, any, undefined, { enrich?: string; page?: string; limit?: string }>,
    res: Response
  ): void => {
    const { postId } = req.params;
    const { enrich, page = '1', limit } = req.query;

    const posts = postsStore.read();
    const quests = questsStore.read();

    const pageNum = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || DEFAULT_PAGE_SIZE;
    const start = (pageNum - 1) * pageSize;
    const end = start + pageSize;

    const replies = posts.filter(p => p.replyTo === postId).slice(start, end);

    const board: BoardData = {
      id: `thread-${postId}`,
      title: 'Thread',
      items: replies.map(r => r.id),
      layout: 'thread',
      createdAt: new Date().toISOString(),
      userId: '',
    };

    if (enrich === 'true') {
      const enriched = enrichBoard(board, { posts, quests });
      res.json(enriched);
      return;
    }

    res.json(board);
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

    const board = boards.find((b) => b.defaultFor === context);
    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    let result: BoardData | EnrichedBoard = board;

    if (enrich === 'true') {
      const enriched = enrichBoard(board, { posts, quests });
      result = {
        ...enriched,
        layout: board.layout ?? 'grid',
      } as EnrichedBoard;
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
    req: Request<{ id: string }, BoardData | { error: string }, undefined, { enrich?: string; page?: string; limit?: string; userId?: string }>,
    res: Response
  ): void => {
    const { id } = req.params;
    const { enrich, page = '1', limit, userId } = req.query;

    const boards = boardsStore.read();
    const posts = postsStore.read();
    const quests = questsStore.read();

    const board = boards.find(b => b.id === id);
    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }
    const pageNum = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || DEFAULT_PAGE_SIZE;
    const start = (pageNum - 1) * pageSize;
    const end = start + pageSize;
    let boardItems = board.items;
    if (userId && board.id === 'my-posts') {
      boardItems = posts.filter(p => p.authorId === userId).map(p => p.id);
    } else if (userId && board.id === 'my-quests') {
      boardItems = quests.filter(q => q.authorId === userId).map(q => q.id);
    }

    const pagedBoard: BoardData = { ...board, items: boardItems.slice(start, end) };

    let result: BoardData | EnrichedBoard = pagedBoard;
    if (enrich === 'true') {
      const enriched = enrichBoard(pagedBoard, { posts, quests });
      result = {
        ...enriched,
        layout: board.layout ?? 'grid',
      } as EnrichedBoard;
    }

    res.json(result);
  }
);

//
// ✅ GET all items from a board (posts/quests)
//
router.get(
  '/:id/items',
  (
    req: Request<{ id: string }, any, undefined, { enrich?: string; userId?: string }>,
    res: Response
  ): void => {
    const { id } = req.params;
    const { enrich, userId } = req.query;
    const boards = boardsStore.read();
    const posts = postsStore.read();
    const quests = questsStore.read();

    const board = boards.find((b) => b.id === id);
    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    let boardItems = board.items;
    if (userId && board.id === 'my-posts') {
      boardItems = posts.filter(p => p.authorId === userId).map(p => p.id);
    } else if (userId && board.id === 'my-quests') {
      boardItems = quests.filter(q => q.authorId === userId).map(q => q.id);
    }

    if (enrich === 'true') {
      const enriched = enrichBoard({ ...board, items: boardItems }, { posts, quests });
      res.json(enriched.enrichedItems);
      return;
    }

    const items = boardItems
      .map((itemId) => posts.find((p) => p.id === itemId) || quests.find((q) => q.id === itemId))
      .filter(Boolean);

  res.json(items);
  }
);

//
// ✅ GET quests from a board
//
router.get(
  '/:id/quests',
  (
    req: Request<{ id: string }, any, undefined, { enrich?: string; userId?: string }>,
    res: Response
  ): void => {
    const { id } = req.params;
    const { enrich, userId } = req.query;
    const boards = boardsStore.read();
    const posts = postsStore.read();
    const quests = questsStore.read();
    const users = usersStore.read();

    const board = boards.find((b) => b.id === id);
    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    let boardItems = board.items;
    if (userId && board.id === 'my-quests') {
      boardItems = quests.filter(q => q.authorId === userId).map(q => q.id);
    }

    const boardQuests = boardItems
      .map((itemId) => quests.find((q) => q.id === itemId))
      .filter((q): q is NonNullable<typeof q> => Boolean(q));

    if (enrich === 'true') {
      const enriched = boardQuests.map((q) =>
        enrichQuest(q, { posts, users })
      );
      res.json(enriched);
      return;
    }

    res.json(boardQuests);
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
      id: customId,
      title,
      description = '',
      items = [],
      filters = {},
      featured = false,
      defaultFor = null,
      layout = "grid",
      questId,
    } = req.body;

    const boards = boardsStore.read();
    const newBoard: BoardData = {
      id: customId || uuidv4(),
      title,
      description,
      items,
      filters,
      featured,
      defaultFor,
      layout,
      createdAt: new Date().toISOString(),
      userId: (req.user as any)?.id || "",
      questId,
    };

    boards.push(newBoard);
    boardsStore.write(boards);
    logBoardAction(newBoard.id, 'create', (req.user as any)?.id || '');
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
    let board = boards.find(b => b.id === req.params.id);

    if (!board) {
      board = {
        id: req.params.id,
        title: req.body.title || 'Untitled Board',
        description: req.body.description || '',
        layout: req.body.layout || 'grid',
        items: req.body.items ?? [],
        filters: req.body.filters ?? {},
        featured: req.body.featured ?? false,
        defaultFor: req.body.defaultFor ?? null,
        createdAt: new Date().toISOString(),
        userId: (req.user as any)?.id || '',
        category: req.body.category,
        questId: req.body.questId,
      } as BoardData;
      boards.push(board);
      boardsStore.write(boards);
      res.status(201).json(board);
      return;
    }

    Object.assign(board, req.body);
    boardsStore.write(boards);
    logBoardAction(board.id, 'update', (req.user as any)?.id || '');
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
    logBoardAction(removed.id, 'delete', (req.user as any)?.id || '');
    res.json(removed);
  }
);

//
// ✅ GET board permissions
//
router.get(
  '/:id/permissions',
  authMiddleware,
  (req: AuthenticatedRequest<{ id: string }>, res: Response): void => {
    const { id } = req.params;
    const userId = req.user?.id;

    const boards = boardsStore.read();
    const board = boards.find(b => b.id === id);
    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    const permission = {
      boardId: id,
      canView: true,
      canEdit: board.userId === userId,
    };

    res.json(permission);
  }
);

export default router;
