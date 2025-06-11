import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/authMiddleware';
import { reviewsStore } from '../models/stores';
import type { AuthenticatedRequest } from '../types/express';
import type { DBReview } from '../types/db';

const router = express.Router();

const bannedWords = ['badword'];

// GET /api/reviews?type=&sort=&search=
router.get('/', (_req: Request<{}, any, undefined, { type?: string; sort?: string; search?: string }>, res: Response): void => {
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
router.get('/:id', (req: Request<{ id: string }>, res: Response): void => {
  const review = reviewsStore.read().find(r => r.id === req.params.id);
  if (!review) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }
  res.json(review);
});

// POST /api/reviews
router.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const { targetType, rating, tags = [], feedback = '', repoUrl, modelId, questId, postId } = req.body;

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

export default router;
