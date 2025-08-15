"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const authMiddleware_1 = require("../middleware/authMiddleware");
const db_1 = require("../db");
const router = express_1.default.Router();
const bannedWords = ['badword'];
// GET /api/reviews?type=&sort=&search=
router.get('/', async (req, res) => {
    const { type, sort, search } = req.query;
    const conditions = [];
    const values = [];
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
    }
    else if (sort === 'recent') {
        query += ' ORDER BY createdat DESC';
    }
    else if (sort === 'controversial') {
        query += ' ORDER BY ABS(rating - 3) DESC';
    }
    try {
        const result = await db_1.pool.query(query, values);
        res.json(result.rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});
// GET /api/reviews/:id
router.get('/:id', async (req, res) => {
    try {
        const result = await db_1.pool.query('SELECT * FROM reviews WHERE id = $1', [req.params.id]);
        const review = result.rows[0];
        if (!review) {
            res.status(404).json({ error: 'Review not found' });
            return;
        }
        res.json(review);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});
// GET /api/reviews/summary/:entityType/:id
router.get('/summary/:entityType/:id', async (req, res) => {
    const { entityType, id } = req.params;
    let column;
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
        const agg = await db_1.pool.query(`SELECT COALESCE(AVG(rating),0) AS averagerating, COUNT(*) AS count FROM reviews WHERE targettype = $1 AND ${column} = $2`, [entityType, id]);
        const tags = await db_1.pool.query(`SELECT tag, COUNT(*) FROM reviews, UNNEST(tags) AS tag WHERE targettype = $1 AND ${column} = $2 GROUP BY tag`, [entityType, id]);
        const tagCounts = {};
        for (const row of tags.rows) {
            tagCounts[row.tag] = Number(row.count);
        }
        const averageRating = parseFloat(Number(agg.rows[0].averagerating).toFixed(2));
        const count = Number(agg.rows[0].count);
        res.json({ averageRating, count, tagCounts });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});
// POST /api/reviews
router.post('/', authMiddleware_1.authMiddleware, async (req, res) => {
    const { targetType, rating, visibility = 'public', status = 'submitted', tags = [], feedback = '', repoUrl, modelId, questId, postId, } = req.body;
    if (!targetType || !rating) {
        res.status(400).json({ error: 'Missing fields' });
        return;
    }
    if (feedback && bannedWords.some((w) => feedback.toLowerCase().includes(w))) {
        res.status(400).json({ error: 'Inappropriate language detected' });
        return;
    }
    const id = (0, uuid_1.v4)();
    try {
        await db_1.pool.query('INSERT INTO reviews (id, reviewerid, targettype, rating, visibility, status, tags, feedback, repourl, modelid, questid, postid, createdat) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)', [
            id,
            req.user.id,
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
        ]);
        res.status(201).json({ id });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});
// PATCH /api/reviews/:id
router.patch('/:id', authMiddleware_1.authMiddleware, async (req, res) => {
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
        const result = await db_1.pool.query(`UPDATE reviews SET ${sets} WHERE id = $${fields.length + 1} RETURNING *`, values);
        const row = result.rows[0];
        if (!row) {
            res.status(404).json({ error: 'Review not found' });
            return;
        }
        res.json(row);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});
// DELETE /api/reviews/:id
router.delete('/:id', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const result = await db_1.pool.query('DELETE FROM reviews WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Review not found' });
            return;
        }
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});
exports.default = router;
