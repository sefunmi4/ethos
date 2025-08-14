"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const authMiddleware_1 = require("../middleware/authMiddleware");
const authOptional_1 = __importDefault(require("../middleware/authOptional"));
const db_1 = require("../db");
const router = express_1.default.Router();
// GET /api/notifications - return notifications for current user
router.get('/', authMiddleware_1.authMiddleware, async (req, res) => {
    const userId = req.user?.id;
    try {
        const result = await db_1.pool.query('SELECT * FROM notifications WHERE userid = $1', [userId]);
        res.json(result.rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});
// POST /api/notifications - create a new notification for a user
router.post('/', authOptional_1.default, async (req, res) => {
    const { userId, message, link } = req.body;
    if (!userId || !message) {
        res.status(400).json({ error: 'Missing fields' });
        return;
    }
    const newNote = {
        id: (0, uuid_1.v4)(),
        userId,
        message,
        link,
        read: false,
        createdAt: new Date().toISOString(),
    };
    try {
        await db_1.pool.query('INSERT INTO notifications (id, userid, message, link, read, createdat) VALUES ($1,$2,$3,$4,$5,$6)', [newNote.id, newNote.userId, newNote.message, newNote.link, newNote.read, newNote.createdAt]);
        res.status(201).json(newNote);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});
// PATCH /api/notifications/:id/read - mark a notification read
router.patch('/:id/read', authMiddleware_1.authMiddleware, async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;
    try {
        const result = await db_1.pool.query('UPDATE notifications SET read = true WHERE id = $1 AND userid = $2 RETURNING *', [id, userId]);
        const row = result.rows[0];
        if (!row) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }
        res.json(row);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});
exports.default = router;
