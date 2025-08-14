import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logBoardAction } from '../utils/boardLogger';
import { authMiddleware } from '../middleware/authMiddleware';
import { boardsStore, postsStore, questsStore, usersStore } from '../models/memoryStores';
import { enrichBoard, enrichQuest } from '../utils/enrich';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { pool, usePg, disablePg } from '../db';
import type { BoardData } from '../types/api';
import type { DBPost, DBQuest } from '../types/db';
import type { EnrichedBoard } from '../types/enriched';
import type { AuthenticatedRequest } from '../types/express';

const toMs = (value?: string | number | Date) => {
  const t = new Date(value ?? 0).getTime();
  return Number.isNaN(t) ? 0 : t;
};


// Gather active quests for the quest board. Returns up to 10 recent quests
// excluding those authored by the requesting user.
const getQuestBoardQuests = (
  quests: ReturnType<typeof questsStore.read>,
  userId?: string
) => {
  return quests
    .filter(q => q.status === 'active' && q.visibility === 'public')
    .filter(q => !userId || q.authorId !== userId)
    .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
    .slice(0, 10)
    .map(q => q.id);
};

// Gather recent request posts for the quest board. Returns up to DEFAULT_PAGE_SIZE
// recent requests excluding archived or private ones.
const getQuestBoardRequests = (
  posts: ReturnType<typeof postsStore.read>,
) => {
  return posts
    .filter(p => p.type === 'request')
    .filter(p => p.visibility !== 'private')
    .filter(p => !p.tags?.includes('archived'))
    .sort((a, b) => toMs(b.timestamp) - toMs(a.timestamp))
    .slice(0, DEFAULT_PAGE_SIZE)
    .map(p => p.id);
};

// Gather posts for the timeline board. Includes all public/request posts
// visible to the requesting user and sorts them with highlight metadata.
const getTimelineBoardItems = (
  posts: ReturnType<typeof postsStore.read>,
  quests: ReturnType<typeof questsStore.read>,
  userId?: string
) => {
  const userQuestIds = userId
    ? quests
        .filter(
          q =>
            q.authorId === userId ||
            (q.collaborators || []).some(c => c.userId === userId) ||
            posts.some(p => p.questId === q.id && p.authorId === userId)
        )
        .map(q => q.id)
    : [];

  const userTaskIds = userId
    ? posts
        .filter(p => p.authorId === userId && p.type === 'task')
        .map(p => p.id)
    : [];

  const withMeta = posts
    .filter(p => p.visibility !== 'private')
    .map(p => {
      let weight = 0;
      let highlight = false;
      if (userId) {
        if (p.questId && userQuestIds.includes(p.questId)) {
          weight = p.type === 'task' ? 3 : 2;
          if (p.type === 'task') highlight = true;
        } else if (
          p.linkedItems?.some(
            li => li.itemType === 'quest' && userQuestIds.includes(li.itemId)
          ) ||
          (p.replyTo && userTaskIds.includes(p.replyTo))
        ) {
          weight = 1;
          highlight = true;
        }
      }
      return { id: p.id, timestamp: toMs(p.timestamp || (p as any).createdAt), weight, highlight };
    })
    .sort((a, b) => b.weight - a.weight || b.timestamp - a.timestamp);

  return {
    items: withMeta.map(it => it.id),
    highlightMap: Object.fromEntries(withMeta.map(it => [it.id, it.highlight])),
  };
};

const router = express.Router();

//
// ✅ GET all boards (?featured=true, ?enrich=true)
//
router.get(
  '/',
  async (
    req: Request<{}, BoardData[], undefined, { featured?: string; enrich?: string; userId?: string }>,
    res: Response
  ): Promise<void> => {
    const { featured, enrich, userId } = req.query;

    if (usePg) {
      try {
        const boardsResult = await pool.query('SELECT * FROM boards');
        const [postsRes, questsRes] = await Promise.all([
          pool.query('SELECT * FROM posts'),
          pool.query('SELECT * FROM quests'),
        ]);

        const posts: DBPost[] = postsRes.rows.map((r: any) => ({
          ...r,
          authorId: r.authorid,
          createdAt: r.createdat,
          boardId: r.boardid,
          timestamp: r.timestamp,
        }));
        const quests: DBQuest[] = questsRes.rows.map((r: any) => ({
          ...r,
          authorId: r.authorid,
          createdAt: r.createdat,
        }));

        let boards = boardsResult.rows.map(b => ({ ...b, items: b.items || [] }));

        boards = boards.map(b => {
          if (userId && b.id === 'my-posts') {
            b.items = posts
              .filter(p => p.authorId === userId && p.systemGenerated !== true)
              .sort((a, b) => toMs(b.timestamp || b.createdAt) - toMs(a.timestamp || a.createdAt))
              .map(p => p.id);
          } else if (userId && b.id === 'my-quests') {
            b.items = quests.filter(q => q.authorId === userId).map(q => q.id);
          } else if (b.id === 'quest-board') {
            b.items = getQuestBoardRequests(posts);
          } else if (b.id === 'timeline-board') {
            b.items = getTimelineBoardItems(posts, quests, userId).items;
          }
          return b;
        });

        if (featured === 'true') {
          boards = boards.filter(b => b.featured === true);
        }

        if (enrich === 'true') {
          boards = boards.map(b => {
            const enriched = enrichBoard(b, { posts, quests, currentUserId: userId || null });
            return { ...enriched, layout: b.layout ?? 'grid', items: b.items } as EnrichedBoard;
          });
        }

        res.json(boards);
        return;
      } catch (err) {
        console.error(err);
        disablePg();
        // fall back to JSON store below
      }
    }

    let boards = boardsStore.read();
    if (boards.length === 0) {
      boards = [];
      boardsStore.write(boards);
    }
    const posts = postsStore.read();
    const quests = questsStore.read();

    let result: (BoardData | EnrichedBoard)[] = boards.map(board => {
      if (userId && board.id === 'my-posts') {
        const filtered = posts
          .filter(
            p =>
              p.authorId === userId &&
              p.systemGenerated !== true
          )
          .sort((a, b) =>
            toMs(b.timestamp || b.createdAt) -
            toMs(a.timestamp || a.createdAt)
          )
          .map(p => p.id);
        return { ...board, items: filtered };
      }

      if (userId && board.id === 'my-quests') {
        const filtered = quests
          .filter(q => q.authorId === userId)
          .map(q => q.id);
        return { ...board, items: filtered };
      }

      if (board.id === 'quest-board') {
        const items = getQuestBoardRequests(posts);
        return { ...board, items };
      }

      if (board.id === 'timeline-board') {
        const { items } = getTimelineBoardItems(posts, quests, userId);
        return { ...board, items };
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

    const replies = posts
      .filter(p => p.replyTo === postId)
      .sort((a, b) => toMs(b.timestamp) - toMs(a.timestamp))
      .slice(start, end);

    const board: BoardData = {
      id: `thread-${postId}`,
      title: 'Thread',
      boardType: 'post',
      items: replies.map(r => r.id),
      layout: 'grid',
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
  async (
    req: Request<{ id: string }, BoardData | { error: string }, undefined, { enrich?: string; page?: string; limit?: string; userId?: string }>,
    res: Response
  ): Promise<void> => {
    const { id } = req.params;
    const { enrich, page = '1', limit, userId } = req.query;

    if (usePg) {
      try {
        const result = await pool.query('SELECT * FROM boards WHERE id = $1', [id]);
        const board = result.rows[0];
        if (!board) {
          res.status(404).json({ error: 'Board not found' });
          return;
        }
        board.items = board.items || [];

        if (enrich === 'true') {
          const [postsRes, questsRes] = await Promise.all([
            pool.query('SELECT * FROM posts'),
            pool.query('SELECT * FROM quests'),
          ]);
          const posts: DBPost[] = postsRes.rows.map((r: any) => ({
            ...r,
            authorId: r.authorid,
            createdAt: r.createdat,
            boardId: r.boardid,
            timestamp: r.timestamp,
          }));
          const quests: DBQuest[] = questsRes.rows.map((r: any) => ({
            ...r,
            authorId: r.authorid,
            createdAt: r.createdat,
          }));
          const enriched = enrichBoard(board, { posts, quests, currentUserId: userId || null });
          res.json({ ...enriched, layout: board.layout ?? 'grid', items: board.items });
        } else {
          res.json(board);
        }
        return;
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
    }

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
    let highlightMap: Record<string, boolean> = {};
    if (board.id === 'quest-board') {
      boardItems = getQuestBoardRequests(posts);
    } else if (board.id === 'timeline-board') {
      const { items, highlightMap: hm } = getTimelineBoardItems(posts, quests, userId);
      boardItems = items;
      highlightMap = hm;
      } else if (userId && board.id === 'my-posts') {
        boardItems = posts
          .filter(
            p => p.authorId === userId && p.systemGenerated !== true
          )
          .sort((a, b) =>
            toMs(b.timestamp || b.createdAt) -
            toMs(a.timestamp || a.createdAt)
          )
          .map(p => p.id);
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
        enrichedItems: enriched.enrichedItems.map(item => {
          if ('id' in item && highlightMap[item.id]) {
            (item as any).highlight = true;
          }
          return item;
        }),
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
  async (
    req: Request<{ id: string }, any, undefined, { enrich?: string; userId?: string }>,
    res: Response
  ): Promise<void> => {
    const { id } = req.params;
    const { enrich, userId } = req.query;

    if (usePg) {
      try {
        const boardResult = await pool.query('SELECT * FROM boards WHERE id = $1', [id]);
        if (boardResult.rowCount === 0) {
          res.status(404).json({ error: 'Board not found' });
          return;
        }
        const board = boardResult.rows[0] as BoardData;
        board.items = board.items || [];

        const postsRes = await pool.query('SELECT * FROM posts');
        const questsRes = await pool.query('SELECT * FROM quests');

        const posts: DBPost[] = postsRes.rows.map((r: any) => ({
          ...r,
          authorId: r.authorid,
          createdAt: r.createdat,
          boardId: r.boardid,
          timestamp: r.timestamp,
        }));
        const quests: DBQuest[] = questsRes.rows.map((r: any) => ({
          ...r,
          authorId: r.authorid,
          createdAt: r.createdat,
        }));

        let boardItems = board.items as string[];
        let highlightMap: Record<string, boolean> = {};

        if (board.id === 'quest-board') {
          boardItems = getQuestBoardRequests(posts);
        } else if (board.id === 'timeline-board') {
          const { items, highlightMap: hm } = getTimelineBoardItems(posts, quests, userId);
          boardItems = items;
          highlightMap = hm;
        } else if (userId && board.id === 'my-posts') {
          boardItems = posts
            .filter(p => p.authorId === userId && p.systemGenerated !== true)
            .sort((a, b) =>
              toMs(b.timestamp || b.createdAt) -
              toMs(a.timestamp || a.createdAt)
            )
            .map(p => p.id);
        } else if (userId && board.id === 'my-quests') {
          boardItems = quests.filter(q => q.authorId === userId).map(q => q.id);
        }

        if (enrich === 'true') {
          const enriched = enrichBoard({ ...board, items: boardItems }, { posts, quests, currentUserId: userId || null });
          const items = enriched.enrichedItems.map(item => {
            if ('id' in item && highlightMap[item.id]) {
              (item as any).highlight = true;
            }
            return item;
          });
          res.json(items);
          return;
        }

        const items = boardItems
          .map(itemId => posts.find(p => p.id === itemId) || quests.find(q => q.id === itemId))
          .filter((i): i is DBPost | DBQuest => Boolean(i))
          .filter(item => {
            if ('type' in item) {
              const p = item as DBPost;
              if (p.tags?.includes('archived')) return false;
              if (board.id === 'quest-board') {
                if (p.type !== 'request') return false;
                if (p.visibility === 'private') return false;
                return true;
              }
              return true;
            }
            const q = item as DBQuest;
            if (board.id === 'quest-board') return false;
            if (q.displayOnBoard === false) return false;
            if (q.status === 'active' && userId) {
              const participant =
                q.authorId === userId ||
                (q.collaborators || []).some(
                  (c: { userId?: string }) => c.userId === userId
                );
              if (!participant) return false;
            }
            return true;
          });

        res.json(items);
        return;
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
    }

    const boards = boardsStore.read();
    const posts = postsStore.read();
    const quests = questsStore.read();

    const board = boards.find((b) => b.id === id);
    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    let boardItems = board.items;
    let highlightMap: Record<string, boolean> = {};
    if (board.id === 'quest-board') {
      boardItems = getQuestBoardRequests(posts);
    } else if (board.id === 'timeline-board') {
      const { items, highlightMap: hm } = getTimelineBoardItems(posts, quests, userId);
      boardItems = items;
      highlightMap = hm;
    } else if (userId && board.id === 'my-posts') {
      boardItems = posts
        .filter(
          p => p.authorId === userId && p.systemGenerated !== true
        )
        .sort((a, b) =>
          toMs(b.timestamp || b.createdAt) -
          toMs(a.timestamp || a.createdAt)
        )
        .map(p => p.id);
    } else if (userId && board.id === 'my-quests') {
      boardItems = quests.filter(q => q.authorId === userId).map(q => q.id);
    }

    if (enrich === 'true') {
      const enriched = enrichBoard({ ...board, items: boardItems }, { posts, quests, currentUserId: userId || null });
      const items = enriched.enrichedItems.map(item => {
        if ('id' in item && highlightMap[item.id]) {
          (item as any).highlight = true;
        }
        return item;
      });
      res.json(items);
      return;
    }

    const items = boardItems
      .map((itemId) => posts.find((p) => p.id === itemId) || quests.find((q) => q.id === itemId))
      .filter((i): i is DBPost | DBQuest => Boolean(i))
      .filter((item) => {
        if ('type' in item) {
          const p = item as DBPost;
          if (p.tags?.includes('archived')) return false;
          if (board.id === 'quest-board') {
            if (p.type !== 'request') return false;
            if (p.visibility === 'private') return false;
            return true;
          }
          return true;
        }
        const q = item as DBQuest;
        if (board.id === 'quest-board') return false;
        if (q.displayOnBoard === false) return false;
        if (q.status === 'active' && userId) {
          const participant =
            q.authorId === userId ||
            (q.collaborators || []).some(
              (c: { userId?: string }) => c.userId === userId
            );
          if (!participant) return false;
        }
        return true;
      });

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
    if (board.id === 'quest-board') {
      boardItems = getQuestBoardQuests(quests, userId).filter(id =>
        quests.find(q => q.id === id)
      );
    } else if (userId && board.id === 'my-quests') {
      boardItems = quests.filter(q => q.authorId === userId).map(q => q.id);
    }

    const boardQuests = boardItems
      .map((itemId) => quests.find((q) => q.id === itemId))
      .filter((q): q is NonNullable<typeof q> => Boolean(q))
      .filter((q) => {
        if (q.displayOnBoard === false) return false;
        if (q.status === 'active' && userId) {
          const participant = q.authorId === userId || (q.collaborators || []).some((c: { userId?: string }) => c.userId === userId);
          if (!participant) return false;
        }
        return true;
      });

    if (enrich === 'true') {
      const enriched = boardQuests.map((q) =>
        enrichQuest(q, { posts, users, currentUserId: userId || null })
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
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (usePg) {
      const {
        id: customId,
        title,
        description = '',
        items = [],
        filters = {},
        featured = false,
        defaultFor = null,
        layout = 'grid',
        boardType = 'post',
        questId,
      } = req.body;
      const id = customId || uuidv4();
      try {
        await pool.query(
          'INSERT INTO boards (id, title, description, boardType, layout, items, filters, featured, defaultFor, createdAt, userId, questId) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
          [
            id,
            title,
            description,
            boardType,
            layout,
            JSON.stringify(items),
            JSON.stringify(filters),
            featured,
            defaultFor,
            new Date().toISOString(),
            (req.user as any)?.id || '',
            questId,
          ]
        );
        const newBoard: BoardData = {
          id,
          title,
          description,
          boardType,
          items,
          filters,
          featured,
          defaultFor,
          layout,
          createdAt: new Date().toISOString(),
          userId: (req.user as any)?.id || '',
          questId,
        };
        res.status(201).json(newBoard);
        return;
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
    }
    const {
      id: customId,
      title,
      description = '',
      items = [],
      filters = {},
      featured = false,
      defaultFor = null,
      layout = "grid",
      boardType = 'post',
      questId,
    } = req.body;

    const boards = boardsStore.read();
    const newBoard: BoardData = {
      id: customId || uuidv4(),
      title,
      description,
      boardType,
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
  async (req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> => {
    if (usePg) {
      try {
        const fields = Object.keys(req.body);
        const values = Object.values(req.body);
        if (fields.length > 0) {
          const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
          values.push(req.params.id);
          const result = await pool.query(
            `UPDATE boards SET ${sets} WHERE id = $${fields.length + 1} RETURNING *`,
            values
          );
          if (result.rows.length === 0) {
            res.status(404).json({ error: 'Board not found' });
            return;
          }
          res.json(result.rows[0]);
          return;
        }
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
    }

    const boards = boardsStore.read();
    let board = boards.find(b => b.id === req.params.id);

    if (!board) {
      board = {
        id: req.params.id,
        title: req.body.title || 'Untitled Board',
        description: req.body.description || '',
        boardType: req.body.boardType || 'post',
        layout: req.body.layout || 'grid',
        items: req.body.items ?? [],
        filters: req.body.filters ?? {},
        featured: req.body.featured ?? false,
        defaultFor: req.body.defaultFor ?? null,
        createdAt: new Date().toISOString(),
        userId: (req.user as any)?.id || '',
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
  async (req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> => {
    if (usePg) {
      try {
        const result = await pool.query('DELETE FROM boards WHERE id = $1 RETURNING *', [req.params.id]);
        const removed = result.rows[0];
        if (!removed) {
          res.status(404).json({ error: 'Board not found' });
          return;
        }
        res.json(removed);
        return;
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
    }

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
