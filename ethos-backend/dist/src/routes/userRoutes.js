"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const authOptional_1 = __importDefault(require("../middleware/authOptional"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const stores_1 = require("../models/stores");
const router = express_1.default.Router();
// GET /api/users?search= - search by username
router.get('/', authOptional_1.default, (req, res) => {
    const { search } = req.query;
    let users = stores_1.usersStore.read().map(u => ({ id: u.id, username: u.username }));
    if (search) {
        const term = search.toLowerCase();
        users = users.filter(u => u.username.toLowerCase().includes(term));
    }
    res.json(users);
});
// GET /api/users/:id - fetch public profile
router.get('/:id', authOptional_1.default, (req, res) => {
    const user = stores_1.usersStore.read().find(u => u.id === req.params.id);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    // Return only public fields
    const { id, username, tags, bio, links, experienceTimeline, xp } = user;
    res.json({ id, username, tags, bio, links, experienceTimeline, xp });
});
// POST /api/users/:id/follow - follow a user
router.post('/:id/follow', authMiddleware_1.authMiddleware, (req, res) => {
    const users = stores_1.usersStore.read();
    const target = users.find(u => u.id === req.params.id);
    const follower = users.find(u => u.id === req.user?.id);
    if (!target || !follower) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    target.followers = Array.from(new Set([...(target.followers || []), follower.id]));
    follower.following = Array.from(new Set([...(follower.following || []), target.id]));
    stores_1.usersStore.write(users);
    const notes = stores_1.notificationsStore.read();
    const newNote = {
        id: (0, uuid_1.v4)(),
        userId: target.id,
        message: `${follower.username} followed you`,
        link: `/profile/${follower.id}`,
        read: false,
        createdAt: new Date().toISOString(),
    };
    stores_1.notificationsStore.write([...notes, newNote]);
    res.json({ followers: target.followers });
});
// POST /api/users/:id/unfollow - unfollow a user
router.post('/:id/unfollow', authMiddleware_1.authMiddleware, (req, res) => {
    const users = stores_1.usersStore.read();
    const target = users.find(u => u.id === req.params.id);
    const follower = users.find(u => u.id === req.user?.id);
    if (!target || !follower) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    target.followers = (target.followers || []).filter(id => id !== follower.id);
    follower.following = (follower.following || []).filter(id => id !== target.id);
    stores_1.usersStore.write(users);
    res.json({ followers: target.followers });
});
exports.default = router;
