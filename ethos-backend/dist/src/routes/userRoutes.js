"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authOptional_1 = __importDefault(require("../middleware/authOptional"));
const stores_1 = require("../models/stores");
const router = express_1.default.Router();
// GET /api/users/:id - fetch public profile
router.get('/:id', authOptional_1.default, (req, res) => {
    const user = stores_1.usersStore.read().find(u => u.id === req.params.id);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    // Return only public fields
    const { id, username, tags, bio, links, experienceTimeline } = user;
    res.json({ id, username, tags, bio, links, experienceTimeline });
});
exports.default = router;
