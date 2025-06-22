"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const boardLogger_1 = require("../utils/boardLogger");
const authMiddleware_1 = require("../middleware/authMiddleware");
const stores_1 = require("../models/stores");
const enrich_1 = require("../utils/enrich");
const constants_1 = require("../constants");
// Only request posts should appear on the quest board. Other post types can
// generate request posts, but the board itself shows requests only.
const getQuestBoardItems = (posts) => {
    const ids = posts
        .filter((p) => {
        if (p.type !== 'request')
            return false;
        return p.visibility === 'public' || p.visibility === 'request_board';
    })
        .map((p) => p.id);
    return ids;
};
const router = express_1.default.Router();
//
// ✅ GET all boards (?featured=true, ?enrich=true)
//
router.get('/', (req, res) => {
    const { featured, enrich, userId } = req.query;
    const boards = stores_1.boardsStore.read();
    const posts = stores_1.postsStore.read();
    const quests = stores_1.questsStore.read();
    let result = boards.map(board => {
        if (userId && board.id === 'my-posts') {
            const filtered = posts
                .filter(p => p.authorId === userId &&
                p.type !== 'meta_system' &&
                p.systemGenerated !== true)
                .map(p => p.id);
            return { ...board, items: filtered };
        }
        if (userId && board.id === 'my-quests') {
            const filtered = quests
                .filter(q => q.authorId === userId)
                .map(q => q.id);
            return { ...board, items: filtered };
        }
        if (board.id === 'quest-board') {
            const items = getQuestBoardItems(posts);
            return { ...board, items };
        }
        return board;
    });
    if (enrich === 'true') {
        result = result.map((board) => {
            const enriched = (0, enrich_1.enrichBoard)(board, { posts, quests });
            return {
                ...enriched,
                layout: board.layout ?? 'grid',
                items: board.items,
                enrichedItems: enriched.enrichedItems,
            };
        });
    }
    if (featured === 'true') {
        result = result.filter(board => board.featured === true);
    }
    res.json(result);
});
//
// ✅ GET thread board for a post
//
router.get('/thread/:postId', (req, res) => {
    const { postId } = req.params;
    const { enrich, page = '1', limit } = req.query;
    const posts = stores_1.postsStore.read();
    const quests = stores_1.questsStore.read();
    const pageNum = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || constants_1.DEFAULT_PAGE_SIZE;
    const start = (pageNum - 1) * pageSize;
    const end = start + pageSize;
    const replies = posts
        .filter(p => p.replyTo === postId)
        .sort((a, b) => {
        const ta = a.timestamp || '';
        const tb = b.timestamp || '';
        return tb.localeCompare(ta);
    })
        .slice(start, end);
    const board = {
        id: `thread-${postId}`,
        title: 'Thread',
        boardType: 'post',
        items: replies.map(r => r.id),
        layout: 'grid',
        createdAt: new Date().toISOString(),
        userId: '',
    };
    if (enrich === 'true') {
        const enriched = (0, enrich_1.enrichBoard)(board, { posts, quests });
        res.json(enriched);
        return;
    }
    res.json(board);
});
//
// ✅ GET default board by context (e.g., /default/home?enrich=true)
//
router.get('/default/:context', (req, res) => {
    const { context } = req.params;
    const { enrich } = req.query;
    const boards = stores_1.boardsStore.read();
    const posts = stores_1.postsStore.read();
    const quests = stores_1.questsStore.read();
    const board = boards.find((b) => b.defaultFor === context);
    if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
    }
    let result = board;
    if (enrich === 'true') {
        const enriched = (0, enrich_1.enrichBoard)(board, { posts, quests });
        result = {
            ...enriched,
            layout: board.layout ?? 'grid',
        };
    }
    res.json(result);
});
//
// ✅ GET a single board by ID
//
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const { enrich, page = '1', limit, userId } = req.query;
    const boards = stores_1.boardsStore.read();
    const posts = stores_1.postsStore.read();
    const quests = stores_1.questsStore.read();
    const board = boards.find(b => b.id === id);
    if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
    }
    const pageNum = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || constants_1.DEFAULT_PAGE_SIZE;
    const start = (pageNum - 1) * pageSize;
    const end = start + pageSize;
    let boardItems = board.items;
    if (board.id === 'quest-board') {
        boardItems = getQuestBoardItems(posts);
    }
    else if (board.id === 'timeline-board') {
        boardItems = posts
            .filter(p => p.type !== 'meta_system' &&
            p.visibility !== 'private')
            .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
            .map(p => p.id);
    }
    else if (userId && board.id === 'my-posts') {
        boardItems = posts
            .filter(p => p.authorId === userId &&
            p.type !== 'meta_system' &&
            p.systemGenerated !== true)
            .map(p => p.id);
    }
    else if (userId && board.id === 'my-quests') {
        boardItems = quests.filter(q => q.authorId === userId).map(q => q.id);
    }
    const pagedBoard = { ...board, items: boardItems.slice(start, end) };
    let result = pagedBoard;
    if (enrich === 'true') {
        const enriched = (0, enrich_1.enrichBoard)(pagedBoard, { posts, quests });
        result = {
            ...enriched,
            layout: board.layout ?? 'grid',
        };
    }
    res.json(result);
});
//
// ✅ GET all items from a board (posts/quests)
//
router.get('/:id/items', (req, res) => {
    const { id } = req.params;
    const { enrich, userId } = req.query;
    const boards = stores_1.boardsStore.read();
    const posts = stores_1.postsStore.read();
    const quests = stores_1.questsStore.read();
    const board = boards.find((b) => b.id === id);
    if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
    }
    let boardItems = board.items;
    if (board.id === 'quest-board') {
        boardItems = getQuestBoardItems(posts);
    }
    else if (board.id === 'timeline-board') {
        boardItems = posts
            .filter(p => p.type !== 'meta_system' &&
            p.visibility !== 'private')
            .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
            .map(p => p.id);
    }
    else if (userId && board.id === 'my-posts') {
        boardItems = posts
            .filter(p => p.authorId === userId &&
            p.type !== 'meta_system' &&
            p.systemGenerated !== true)
            .map(p => p.id);
    }
    else if (userId && board.id === 'my-quests') {
        boardItems = quests.filter(q => q.authorId === userId).map(q => q.id);
    }
    if (enrich === 'true') {
        const enriched = (0, enrich_1.enrichBoard)({ ...board, items: boardItems }, { posts, quests, currentUserId: userId || null });
        res.json(enriched.enrichedItems);
        return;
    }
    const items = boardItems
        .map((itemId) => posts.find((p) => p.id === itemId) || quests.find((q) => q.id === itemId))
        .filter((i) => Boolean(i))
        .filter((item) => {
        if ('type' in item) {
            const p = item;
            if (p.type !== 'request')
                return false;
            return (p.visibility === 'public' ||
                p.visibility === 'request_board' ||
                p.needsHelp === true);
        }
        const q = item;
        if (q.displayOnBoard === false)
            return false;
        if (q.status === 'active' && userId) {
            const participant = q.authorId === userId ||
                (q.collaborators || []).some((c) => c.userId === userId);
            if (!participant)
                return false;
        }
        return true;
    });
    res.json(items);
});
//
// ✅ GET quests from a board
//
router.get('/:id/quests', (req, res) => {
    const { id } = req.params;
    const { enrich, userId } = req.query;
    const boards = stores_1.boardsStore.read();
    const posts = stores_1.postsStore.read();
    const quests = stores_1.questsStore.read();
    const users = stores_1.usersStore.read();
    const board = boards.find((b) => b.id === id);
    if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
    }
    let boardItems = board.items;
    if (board.id === 'quest-board') {
        boardItems = getQuestBoardItems(posts).filter(id => quests.find(q => q.id === id));
    }
    else if (userId && board.id === 'my-quests') {
        boardItems = quests.filter(q => q.authorId === userId).map(q => q.id);
    }
    const boardQuests = boardItems
        .map((itemId) => quests.find((q) => q.id === itemId))
        .filter((q) => Boolean(q))
        .filter((q) => {
        if (q.displayOnBoard === false)
            return false;
        if (q.status === 'active' && userId) {
            const participant = q.authorId === userId || (q.collaborators || []).some((c) => c.userId === userId);
            if (!participant)
                return false;
        }
        return true;
    });
    if (enrich === 'true') {
        const enriched = boardQuests.map((q) => (0, enrich_1.enrichQuest)(q, { posts, users, currentUserId: userId || null }));
        res.json(enriched);
        return;
    }
    res.json(boardQuests);
});
//
// ✅ POST create a new board
//
router.post('/', authMiddleware_1.authMiddleware, (req, res) => {
    const { id: customId, title, description = '', items = [], filters = {}, featured = false, defaultFor = null, layout = "grid", boardType = 'post', questId, } = req.body;
    const boards = stores_1.boardsStore.read();
    const newBoard = {
        id: customId || (0, uuid_1.v4)(),
        title,
        description,
        boardType,
        items,
        filters,
        featured,
        defaultFor,
        layout,
        createdAt: new Date().toISOString(),
        userId: req.user?.id || "",
        questId,
    };
    boards.push(newBoard);
    stores_1.boardsStore.write(boards);
    (0, boardLogger_1.logBoardAction)(newBoard.id, 'create', req.user?.id || '');
    res.status(201).json(newBoard);
});
//
// ✅ PATCH update board
//
router.patch('/:id', authMiddleware_1.authMiddleware, (req, res) => {
    const boards = stores_1.boardsStore.read();
    let board = boards.find(b => b.id === req.params.id);
    if (!board) {
        board = {
            id: req.params.id,
            title: req.body.title || 'Untitled Board',
            description: req.body.description || '',
            boardType: req.body.boardType || 'post',
            layout: req.body.layout || 'grid',
            items: req.body.items ?? [],
            filters: req.body.filters ?? {},
            featured: req.body.featured ?? false,
            defaultFor: req.body.defaultFor ?? null,
            createdAt: new Date().toISOString(),
            userId: req.user?.id || '',
            questId: req.body.questId,
        };
        boards.push(board);
        stores_1.boardsStore.write(boards);
        res.status(201).json(board);
        return;
    }
    Object.assign(board, req.body);
    stores_1.boardsStore.write(boards);
    (0, boardLogger_1.logBoardAction)(board.id, 'update', req.user?.id || '');
    res.json(board);
});
//
// ✅ POST remove an item from board
//
router.post('/:id/remove', authMiddleware_1.authMiddleware, (req, res) => {
    const { itemId } = req.body;
    const boards = stores_1.boardsStore.read();
    const board = boards.find(b => b.id === req.params.id);
    if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
    }
    board.items = board.items.filter(id => id !== itemId);
    stores_1.boardsStore.write(boards);
    res.json({ success: true });
});
//
// ✅ DELETE board
//
router.delete('/:id', authMiddleware_1.authMiddleware, (req, res) => {
    const boards = stores_1.boardsStore.read();
    const index = boards.findIndex(b => b.id === req.params.id);
    if (index === -1) {
        res.status(404).json({ error: 'Board not found' });
        return;
    }
    const [removed] = boards.splice(index, 1);
    stores_1.boardsStore.write(boards);
    (0, boardLogger_1.logBoardAction)(removed.id, 'delete', req.user?.id || '');
    res.json(removed);
});
//
// ✅ GET board permissions
//
router.get('/:id/permissions', authMiddleware_1.authMiddleware, (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const boards = stores_1.boardsStore.read();
    const board = boards.find(b => b.id === id);
    if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
    }
    const permission = {
        boardId: id,
        canView: true,
        canEdit: board.userId === userId,
    };
    res.json(permission);
});
exports.default = router;
