"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const authMiddleware_1 = require("../middleware/authMiddleware");
const stores_1 = require("../models/stores");
const router = express_1.default.Router();
const bannedWords = ['badword'];
// GET /api/reviews?type=&sort=&search=
router.get('/', (_req, res) => {
    const { type, sort, search } = _req.query;
    let reviews = stores_1.reviewsStore.read();
    if (type) {
        reviews = reviews.filter(r => r.targetType === type);
    }
    if (search) {
        const term = search.toLowerCase();
        reviews = reviews.filter(r => r.feedback?.toLowerCase().includes(term));
    }
    if (sort === 'highest') {
        reviews = reviews.sort((a, b) => b.rating - a.rating);
    }
    else if (sort === 'recent') {
        reviews = reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    else if (sort === 'controversial') {
        reviews = reviews.sort((a, b) => Math.abs(b.rating - 3) - Math.abs(a.rating - 3));
    }
    res.json(reviews);
});
// GET /api/reviews/:id
router.get('/:id', (req, res) => {
    const review = stores_1.reviewsStore.read().find(r => r.id === req.params.id);
    if (!review) {
        res.status(404).json({ error: 'Review not found' });
        return;
    }
    res.json(review);
});
// GET /api/reviews/summary/:entityType/:id
router.get('/summary/:entityType/:id', (req, res) => {
    const { entityType, id } = req.params;
    const reviews = stores_1.reviewsStore.read().filter(r => {
        if (r.targetType !== entityType)
            return false;
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
    const tagCounts = {};
    reviews.forEach(r => {
        (r.tags || []).forEach(t => {
            tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
    });
    const averageRating = parseFloat((total / reviews.length).toFixed(2));
    res.json({ averageRating, count: reviews.length, tagCounts });
});
// POST /api/reviews
router.post('/', authMiddleware_1.authMiddleware, (req, res) => {
    const { targetType, rating, tags = [], feedback = '', repoUrl, modelId, questId, postId, visibility = 'public', status = 'submitted', } = req.body;
    if (!targetType || !rating) {
        res.status(400).json({ error: 'Missing fields' });
        return;
    }
    if (feedback && bannedWords.some(w => feedback.toLowerCase().includes(w))) {
        res.status(400).json({ error: 'Inappropriate language detected' });
        return;
    }
    const reviews = stores_1.reviewsStore.read();
    const newReview = {
        id: (0, uuid_1.v4)(),
        reviewerId: req.user.id,
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
    stores_1.reviewsStore.write(reviews);
    res.status(201).json(newReview);
});
// PATCH /api/reviews/:id
router.patch('/:id', authMiddleware_1.authMiddleware, (req, res) => {
    const reviews = stores_1.reviewsStore.read();
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
    stores_1.reviewsStore.write(reviews);
    res.json(review);
});
exports.default = router;
