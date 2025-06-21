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
// POST /api/reviews
router.post('/', authMiddleware_1.authMiddleware, (req, res) => {
    const { targetType, rating, tags = [], feedback = '', repoUrl, modelId, questId, postId } = req.body;
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
exports.default = router;
