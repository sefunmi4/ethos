"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const authMiddleware_1 = require("../middleware/authMiddleware");
const authOptional_1 = __importDefault(require("../middleware/authOptional"));
const stores_1 = require("../models/stores");
const router = express_1.default.Router();
// GET /api/notifications - return notifications for current user
router.get('/', authMiddleware_1.authMiddleware, (req, res) => {
    const userId = req.user?.id;
    const all = stores_1.notificationsStore.read();
    const userNotes = all.filter(n => n.userId === userId);
    res.json(userNotes);
});
// POST /api/notifications - create a new notification for a user
router.post('/', authOptional_1.default, (req, res) => {
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
    const notes = stores_1.notificationsStore.read();
    stores_1.notificationsStore.write([...notes, newNote]);
    res.status(201).json(newNote);
});
// PATCH /api/notifications/:id/read - mark a notification read
router.patch('/:id/read', authMiddleware_1.authMiddleware, (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const notes = stores_1.notificationsStore.read();
    const note = notes.find(n => n.id === id && n.userId === userId);
    if (!note) {
        res.status(404).json({ error: 'Notification not found' });
        return;
    }
    note.read = true;
    stores_1.notificationsStore.write(notes);
    res.json(note);
});
exports.default = router;
