import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logBoardAction } from '../utils/boardLogger';
import { authMiddleware } from '../middleware/authMiddleware';
import { enrichBoard, enrichQuest } from '../utils/enrich';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { pool } from '../db';
import type { BoardData } from '../types/api';
import type { DBPost, DBQuest, DBUser } from '../types/db';
import type { EnrichedBoard } from '../types/enriched';
import type { AuthenticatedRequest } from '../types/express';

const toMs = (value?: string | number | Date) => {
  const t = new Date(value ?? 0).getTime();
  return Number.isNaN(t) ? 0 : t;
};

// Gather active quests for the quest board. Returns up to 10 recent quests
// excluding those authored by the requesting user.
const getQuestBoardQuests = async (userId?: string): Promise<string[]> => {
  const params: any[] = [];
  let query =
    "SELECT id FROM quests WHERE status = 'active' AND visibility = 'public'";
  if (userId) {
    query += ' AND authorid <> $1';
    params.push(userId);
  }
  query += ' ORDER BY createdat DESC LIMIT 10';
  const { rows } = await pool.query(query, params);
  return rows.map((r: any) => r.id);
};

// Gather recent request posts for the quest board. Returns up to DEFAULT_PAGE_SIZE
// recent requests excluding archived or private ones.
const getQuestBoardRequests = async (): Promise<string[]> => {
  const { rows } = await pool.query(
    `SELECT id FROM posts
       WHERE type = 'request'
         AND (visibility IS NULL OR visibility <> 'private')
         AND (tags IS NULL OR NOT tags @> ARRAY['archived'])
       ORDER BY COALESCE(timestamp, createdat) DESC
       LIMIT $1`,
    [DEFAULT_PAGE_SIZE]
  );
  return rows.map((r: any) => r.id);
};

// Gather posts for the timeline board. Includes all public/request posts
// visible to the requesting user and sorts them with highlight metadata.
const getTimelineBoardItems = async (
  userId?: string
): Promise<{ items: string[]; highlightMap: Record<string, boolean> }> => {
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

  const userQuestIds = userId
    ? quests
        .filter(
          (q) =>
            q.authorId === userId ||
            (q.collaborators || []).some((c) => c.userId === userId) ||
            posts.some((p) => p.questId === q.id && p.authorId === userId)
        )
        .map((q) => q.id)
    : [];

  const userTaskIds = userId
    ? posts
        .filter((p) => p.authorId === userId && p.type === 'task')
        .map((p) => p.id)
    : [];

  const withMeta = posts
    .filter((p) => p.visibility !== 'private')
    .map((p) => {
      let weight = 0;
      let highlight = false;
      if (userId) {
        if (p.questId && userQuestIds.includes(p.questId)) {
          weight = p.type === 'task' ? 3 : 2;
          if (p.type === 'task') highlight = true;
        } else if (
          p.linkedItems?.some(
            (li) => li.itemType === 'quest' && userQuestIds.includes(li.itemId)
          ) ||
          (p.replyTo && userTaskIds.includes(p.replyTo))
        ) {
          weight = 1;
          highlight = true;
        }
      }
      return {
        id: p.id,
        timestamp: toMs(p.timestamp || (p as any).createdAt),
        weight,
        highlight,
      };
    })
    .sort((a, b) => b.weight - a.weight || b.timestamp - a.timestamp);

  return {
    items: withMeta.map((it) => it.id),
    highlightMap: Object.fromEntries(withMeta.map((it) => [it.id, it.highlight])),
  };
};

const router = express.Router();

// GET all boards (?featured=true, ?enrich=true)
router.get(
  '/',
  async (
    req: Request<{}, BoardData[], undefined, { featured?: string; enrich?: string; userId?: string }>,
    res: Response
  ): Promise<void> => {
    const { featured, enrich, userId } = req.query;

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

      let boards = boardsResult.rows.map((b) => ({ ...b, items: b.items || [] }));

      boards = await Promise.all(
        boards.map(async (b) => {
          if (userId && b.id === 'my-posts') {
            b.items = posts
              .filter((p) => p.authorId === userId && p.systemGenerated !== true)
              .sort(
                (a, b) =>
                  toMs(b.timestamp || b.createdAt) -
                  toMs(a.timestamp || a.createdAt)
              )
              .map((p) => p.id);
          } else if (userId && b.id === 'my-quests') {
            b.items = quests.filter((q) => q.authorId === userId).map((q) => q.id);
          } else if (b.id === 'quest-board') {
            b.items = await getQuestBoardRequests();
          } else if (b.id === 'timeline-board') {
            b.items = (await getTimelineBoardItems(userId)).items;
          }
          return b;
        })
      );

      if (featured === 'true') {
        boards = boards.filter((b) => b.featured === true);
      }

      if (enrich === 'true') {
        boards = boards.map((b) => {
          const enriched = enrichBoard(b, { posts, quests, currentUserId: userId || null });
          return { ...enriched, layout: b.layout ?? 'grid', items: b.items } as EnrichedBoard;
        });
      }

      res.json(boards);
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
  }
);

// GET a single board by ID
router.get(
  '/:id',
  async (
    req: Request<{ id: string }, BoardData | { error: string }, undefined, { enrich?: string; page?: string; limit?: string; userId?: string }>,
    res: Response
  ): Promise<void> => {
    const { id } = req.params;
    const { enrich, page = '1', limit, userId } = req.query;

    try {
      const result = await pool.query('SELECT * FROM boards WHERE id = $1', [id]);
      const board = result.rows[0];
      if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }
      board.items = board.items || [];

      let boardItems: string[] = board.items;
      let highlightMap: Record<string, boolean> = {};

      if (board.id === 'quest-board') {
        boardItems = await getQuestBoardRequests();
      } else if (board.id === 'timeline-board') {
        const { items, highlightMap: hm } = await getTimelineBoardItems(userId);
        boardItems = items;
        highlightMap = hm;
      } else if (userId && board.id === 'my-posts') {
        const postsRes = await pool.query(
          `SELECT id, authorid, timestamp, createdat, systemgenerated FROM posts
           WHERE authorid = $1 AND (systemgenerated IS NULL OR systemgenerated != true)
           ORDER BY COALESCE(timestamp, createdat) DESC`,
          [userId]
        );
        boardItems = postsRes.rows.map((r: any) => r.id);
      } else if (userId && board.id === 'my-quests') {
        const questsRes = await pool.query('SELECT id FROM quests WHERE authorid = $1', [userId]);
        boardItems = questsRes.rows.map((r: any) => r.id);
      }

      const pageNum = parseInt(page as string, 10) || 1;
      const pageSize = parseInt(limit as string, 10) || DEFAULT_PAGE_SIZE;
      const start = (pageNum - 1) * pageSize;
      const end = start + pageSize;
      const pagedBoard: BoardData = { ...board, items: boardItems.slice(start, end) };

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
        const enriched = enrichBoard(pagedBoard, { posts, quests });
        const resultBoard: EnrichedBoard = {
          ...enriched,
          layout: board.layout ?? 'grid',
          enrichedItems: enriched.enrichedItems.map((item) => {
            if ('id' in item && highlightMap[item.id]) {
              (item as any).highlight = true;
            }
            return item;
          }),
        };
        res.json(resultBoard);
      } else {
        res.json(pagedBoard);
      }
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
  }
);

// GET all items from a board (posts/quests)
router.get(
  '/:id/items',
  async (
    req: Request<{ id: string }, any, undefined, { enrich?: string; userId?: string }>,
    res: Response
  ): Promise<void> => {
    const { id } = req.params;
    const { enrich, userId } = req.query;

    try {
      const boardResult = await pool.query('SELECT * FROM boards WHERE id = $1', [id]);
      if (boardResult.rowCount === 0) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }
      const board = boardResult.rows[0] as BoardData;
      board.items = board.items || [];

      let boardItems = board.items as string[];
      let highlightMap: Record<string, boolean> = {};

      if (board.id === 'quest-board') {
        boardItems = await getQuestBoardRequests();
      } else if (board.id === 'timeline-board') {
        const { items, highlightMap: hm } = await getTimelineBoardItems(userId);
        boardItems = items;
        highlightMap = hm;
      } else if (userId && board.id === 'my-posts') {
        const postsRes = await pool.query(
          `SELECT id, authorid, timestamp, createdat, systemgenerated FROM posts
           WHERE authorid = $1 AND (systemgenerated IS NULL OR systemgenerated != true)
           ORDER BY COALESCE(timestamp, createdat) DESC`,
          [userId]
        );
        boardItems = postsRes.rows.map((r: any) => r.id);
      } else if (userId && board.id === 'my-quests') {
        const questsRes = await pool.query('SELECT id FROM quests WHERE authorid = $1', [userId]);
        boardItems = questsRes.rows.map((r: any) => r.id);
      }

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

      if (enrich === 'true') {
        const enriched = enrichBoard({ ...board, items: boardItems }, { posts, quests, currentUserId: userId || null });
        const items = enriched.enrichedItems.map((item) => {
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
              (q.collaborators || []).some((c: { userId?: string }) => c.userId === userId);
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
);

// GET quests from a board
router.get(
  '/:id/quests',
  async (
    req: Request<{ id: string }, any, undefined, { enrich?: string; userId?: string }>,
    res: Response
  ): Promise<void> => {
    const { id } = req.params;
    const { enrich, userId } = req.query;

    try {
      const boardRes = await pool.query('SELECT * FROM boards WHERE id = $1', [id]);
      if (boardRes.rowCount === 0) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }
      const board = boardRes.rows[0];
      board.items = board.items || [];

      let boardItems: string[] = board.items;
      if (board.id === 'quest-board') {
        boardItems = await getQuestBoardQuests(userId);
      } else if (userId && board.id === 'my-quests') {
        const questsRes = await pool.query('SELECT id FROM quests WHERE authorid = $1', [userId]);
        boardItems = questsRes.rows.map((r: any) => r.id);
      }

      if (boardItems.length === 0) {
        res.json([]);
        return;
      }

      const questsRes = await pool.query('SELECT * FROM quests WHERE id = ANY($1::text[])', [boardItems]);
      let boardQuests: DBQuest[] = questsRes.rows.map((r: any) => ({
        ...r,
        authorId: r.authorid,
        createdAt: r.createdat,
      }));
      boardQuests = boardQuests.filter((q) => {
        if (q.displayOnBoard === false) return false;
        if (q.status === 'active' && userId) {
          const participant =
            q.authorId === userId || (q.collaborators || []).some((c: { userId?: string }) => c.userId === userId);
          if (!participant) return false;
        }
        return true;
      });

      if (enrich === 'true') {
        const [postsRes, usersRes] = await Promise.all([
          pool.query('SELECT * FROM posts'),
          pool.query('SELECT * FROM users'),
        ]);
        const posts: DBPost[] = postsRes.rows.map((r: any) => ({
          ...r,
          authorId: r.authorid,
          createdAt: r.createdat,
          boardId: r.boardid,
          timestamp: r.timestamp,
        }));
        const users: DBUser[] = usersRes.rows.map((r: any) => ({ ...r }));
        const enriched = boardQuests.map((q) =>
          enrichQuest(q, { posts, users, currentUserId: userId || null })
        );
        res.json(enriched);
        return;
      }

      res.json(boardQuests);
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
  }
);

// POST create a new board
router.post(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
      logBoardAction(id, 'create', (req.user as any)?.id || '');
      res.status(201).json(newBoard);
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
  }
);

// PATCH update board
router.patch(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> => {
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
        logBoardAction(req.params.id, 'update', (req.user as any)?.id || '');
        res.json(result.rows[0]);
        return;
      }
      res.status(400).json({ error: 'No fields to update' });
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
  }
);

// POST remove an item from board
router.post(
  '/:id/remove',
  authMiddleware,
  async (req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> => {
    const { itemId } = req.body;
    try {
      const boardRes = await pool.query('SELECT items FROM boards WHERE id = $1', [req.params.id]);
      if (boardRes.rowCount === 0) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }
      const items: string[] = (boardRes.rows[0].items || []).filter(
        (id: string) => id !== itemId
      );
      await pool.query('UPDATE boards SET items = $2 WHERE id = $1', [req.params.id, JSON.stringify(items)]);
      res.json({ success: true });
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
  }
);

// DELETE board
router.delete(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> => {
    try {
      const result = await pool.query('DELETE FROM boards WHERE id = $1 RETURNING *', [req.params.id]);
      const removed = result.rows[0];
      if (!removed) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }
      logBoardAction(req.params.id, 'delete', (req.user as any)?.id || '');
      res.json(removed);
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
  }
);

// GET board permissions
router.get(
  '/:id/permissions',
  authMiddleware,
  async (req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
      const result = await pool.query('SELECT userid FROM boards WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }
      const boardUserId = result.rows[0].userid;
      const permission = {
        boardId: id,
        canView: true,
        canEdit: boardUserId === userId,
      };

      res.json(permission);
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
  }
);

export default router;
