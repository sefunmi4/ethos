import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/authMiddleware';
import { reviewsStore } from '../models/stores';
import { pool } from '../db';
import type { AuthenticatedRequest } from '../types/express';
import type { DBReview } from '../types/db';

const router = express.Router();

const usePg = process.env.NODE_ENV !== 'test';

const bannedWords = ['badword'];

// GET /api/reviews?type=&sort=&search=
router.get('/', async (_req: Request<{}, any, undefined, { type?: string; sort?: string; search?: string }>, res: Response): Promise<void> => {
  if (usePg) {
    try {
      const result = await pool.query('SELECT * FROM reviews');
      res.json(result.rows);
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
  }
  const { type, sort, search } = _req.query;
  let reviews = reviewsStore.read();

  if (type) {
    reviews = reviews.filter(r => r.targetType === type);
  }

  if (search) {
    const term = search.toLowerCase();
    reviews = reviews.filter(r => r.feedback?.toLowerCase().includes(term));
  }

  if (sort === 'highest') {
    reviews = reviews.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'recent') {
    reviews = reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else if (sort === 'controversial') {
    reviews = reviews.sort((a, b) => Math.abs(b.rating - 3) - Math.abs(a.rating - 3));
  }

  res.json(reviews);
});

// GET /api/reviews/:id
router.get('/:id', async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  if (usePg) {
    try {
      const result = await pool.query('SELECT * FROM reviews WHERE id = $1', [req.params.id]);
      const review = result.rows[0];
      if (!review) {
        res.status(404).json({ error: 'Review not found' });
        return;
      }
      res.json(review);
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
  }
  const review = reviewsStore.read().find(r => r.id === req.params.id);
  if (!review) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }
  res.json(review);
});

// GET /api/reviews/summary/:entityType/:id
router.get('/summary/:entityType/:id', (req: Request<{ entityType: string; id: string }>, res: Response): void => {
  const { entityType, id } = req.params;
  const reviews = reviewsStore.read().filter(r => {
    if (r.targetType !== entityType) return false;
    switch (entityType) {
      case 'quest':
        return r.questId === id;
      case 'ai_app':
        return r.repoUrl === id;
      case 'dataset':
        return r.modelId === id;
      case 'creator':
        return r.modelId === id;
      default:
        return false;
    }
  });

  if (reviews.length === 0) {
    res.json({ averageRating: 0, count: 0, tagCounts: {} });
    return;
  }

  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  const tagCounts: Record<string, number> = {};
  reviews.forEach(r => {
    (r.tags || []).forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });
  const averageRating = parseFloat((total / reviews.length).toFixed(2));
  res.json({ averageRating, count: reviews.length, tagCounts });
});

// POST /api/reviews
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (usePg) {
    const { targetType, rating, visibility = 'public', status = 'submitted', tags = [], feedback = '', repoUrl, modelId, questId, postId } = req.body;
    if (!targetType || !rating) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }
    if (feedback && bannedWords.some(w => feedback.toLowerCase().includes(w))) {
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
          JSON.stringify(tags),
          feedback,
          repoUrl,
          modelId,
          questId,
          postId,
          new Date().toISOString(),
        ]
      );
      res.status(201).json({ id });
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
  }
  const {
    targetType,
    rating,
    tags = [],
    feedback = '',
    repoUrl,
    modelId,
    questId,
    postId,
    visibility = 'public',
    status = 'submitted',
  } = req.body;

  if (!targetType || !rating) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }

  if (feedback && bannedWords.some(w => feedback.toLowerCase().includes(w))) {
    res.status(400).json({ error: 'Inappropriate language detected' });
    return;
  }

  const reviews = reviewsStore.read();
  const newReview: DBReview = {
    id: uuidv4(),
    reviewerId: req.user!.id,
    targetType,
    rating: Math.min(5, Math.max(1, Number(rating))),
    visibility,
    status,
    tags,
    feedback,
    repoUrl,
    modelId,
    questId,
    postId,
    createdAt: new Date().toISOString(),
  };

  reviews.push(newReview);
  reviewsStore.write(reviews);
  res.status(201).json(newReview);
});

// PATCH /api/reviews/:id
router.patch('/:id', authMiddleware, async (req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> => {
  if (usePg) {
    try {
      const fields = Object.keys(req.body);
      const values = Object.values(req.body);
      if (fields.length > 0) {
        const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
        values.push(req.params.id);
        const result = await pool.query(`UPDATE reviews SET ${sets} WHERE id = $${fields.length + 1} RETURNING *`, values);
        const row = result.rows[0];
        if (!row) {
          res.status(404).json({ error: 'Review not found' });
          return;
        }
        res.json(row);
        return;
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
  }
  const reviews = reviewsStore.read();
  const review = reviews.find(r => r.id === req.params.id);
  if (!review) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }

  const { feedback } = req.body;
  if (feedback && bannedWords.some(w => String(feedback).toLowerCase().includes(w))) {
    res.status(400).json({ error: 'Inappropriate language detected' });
    return;
  }

  Object.assign(review, req.body);

  if ('rating' in req.body && typeof review.rating === 'number') {
    review.rating = Math.min(5, Math.max(1, Number(review.rating)));
  }

  reviewsStore.write(reviews);
  res.json(review);
});

export default router;
