import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/authMiddleware';
import { pool } from '../db';
import type { AuthenticatedRequest } from '../types/express';

const router = express.Router();


const bannedWords = ['badword'];

// GET /api/reviews?type=&sort=&search=
router.get(
  '/',
  async (
    req: Request<{}, any, undefined, { type?: string; sort?: string; search?: string }>,
    res: Response
  ): Promise<void> => {
    const { type, sort, search } = req.query;
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (type) {
      conditions.push(`targettype = $${idx++}`);
      values.push(type);
    }

    if (search) {
      conditions.push(`LOWER(feedback) LIKE $${idx++}`);
      values.push(`%${search.toLowerCase()}%`);
    }

    let query = 'SELECT * FROM reviews';
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    if (sort === 'highest') {
      query += ' ORDER BY rating DESC';
    } else if (sort === 'recent') {
      query += ' ORDER BY createdat DESC';
    } else if (sort === 'controversial') {
      query += ' ORDER BY ABS(rating - 3) DESC';
    }

    try {
      const result = await pool.query(query, values);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

// GET /api/reviews/:id
router.get('/:id', async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM reviews WHERE id = $1', [req.params.id]);
    const review = result.rows[0];
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    res.json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/reviews/summary/:entityType/:id
router.get(
  '/summary/:entityType/:id',
  async (req: Request<{ entityType: string; id: string }>, res: Response): Promise<void> => {
    const { entityType, id } = req.params;
    let column: string;
    switch (entityType) {
      case 'quest':
        column = 'questid';
        break;
      case 'ai_app':
        column = 'repourl';
        break;
      case 'dataset':
      case 'creator':
        column = 'modelid';
        break;
      default:
        res.status(400).json({ error: 'Invalid entity type' });
        return;
    }
    try {
      const agg = await pool.query(
        `SELECT COALESCE(AVG(rating),0) AS averagerating, COUNT(*) AS count FROM reviews WHERE targettype = $1 AND ${column} = $2`,
        [entityType, id]
      );
      const tags = await pool.query(
        `SELECT tag, COUNT(*) FROM reviews, UNNEST(tags) AS tag WHERE targettype = $1 AND ${column} = $2 GROUP BY tag`,
        [entityType, id]
      );
      const tagCounts: Record<string, number> = {};
      for (const row of tags.rows) {
        tagCounts[row.tag] = Number(row.count);
      }
      const averageRating = parseFloat(Number(agg.rows[0].averagerating).toFixed(2));
      const count = Number(agg.rows[0].count);
      res.json({ averageRating, count, tagCounts });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

// POST /api/reviews
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const {
    targetType,
    rating,
    visibility = 'public',
    status = 'submitted',
    tags = [],
    feedback = '',
    repoUrl,
    modelId,
    questId,
    postId,
  } = req.body;

  if (!targetType || !rating) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }

  if (feedback && bannedWords.some((w) => feedback.toLowerCase().includes(w))) {
    res.status(400).json({ error: 'Inappropriate language detected' });
    return;
  }

  const id = uuidv4();
  try {
    await pool.query(
      'INSERT INTO reviews (id, reviewerid, targettype, rating, visibility, status, tags, feedback, repourl, modelid, questid, postid, createdat) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      [
        id,
        req.user!.id,
        targetType,
        Math.min(5, Math.max(1, Number(rating))),
        visibility,
        status,
        tags,
        feedback,
        repoUrl,
        modelId,
        questId,
        postId,
        new Date().toISOString(),
      ]
    );
    res.status(201).json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PATCH /api/reviews/:id
router.patch(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> => {
    const updates = { ...req.body };

    if (updates.feedback && bannedWords.some((w) => String(updates.feedback).toLowerCase().includes(w))) {
      res.status(400).json({ error: 'Inappropriate language detected' });
      return;
    }

    if (updates.rating !== undefined) {
      updates.rating = Math.min(5, Math.max(1, Number(updates.rating)));
    }

    const fields = Object.keys(updates);
    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    const values = Object.values(updates);
    const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    values.push(req.params.id);

    try {
      const result = await pool.query(
        `UPDATE reviews SET ${sets} WHERE id = $${fields.length + 1} RETURNING *`,
        values
      );
      const row = result.rows[0];
      if (!row) {
        res.status(404).json({ error: 'Review not found' });
        return;
      }
      res.json(row);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

// DELETE /api/reviews/:id
router.delete(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> => {
    try {
      const result = await pool.query('DELETE FROM reviews WHERE id = $1 RETURNING *', [req.params.id]);
      if (result.rowCount === 0) {
        res.status(404).json({ error: 'Review not found' });
        return;
      }
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

export default router;
