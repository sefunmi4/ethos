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
const boardContextDefaults_1 = require("../data/boardContextDefaults");
const enrich_1 = require("../utils/enrich");
const constants_1 = require("../constants");
const db_1 = require("../db");
// Gather active quests for the quest board. Returns up to 10 recent quests
// excluding those authored by the requesting user.
const getQuestBoardQuests = (quests, userId) => {
    return quests
        .filter(q => q.status === 'active' && q.visibility === 'public')
        .filter(q => !userId || q.authorId !== userId)
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        .slice(0, 10)
        .map(q => q.id);
};
// Gather recent request posts for the quest board. Returns up to DEFAULT_PAGE_SIZE
// recent requests excluding archived or private ones.
const getQuestBoardRequests = (posts) => {
    return posts
        .filter(p => p.type === 'request')
        .filter(p => p.visibility !== 'private')
        .filter(p => !p.tags?.includes('archived'))
        .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
        .slice(0, constants_1.DEFAULT_PAGE_SIZE)
        .map(p => p.id);
};
const router = express_1.default.Router();
//
// ✅ GET all boards (?featured=true, ?enrich=true)
//
router.get('/', async (req, res) => {
    const { featured, enrich, userId } = req.query;
    if (db_1.usePg) {
        try {
            const boardsResult = await db_1.pool.query('SELECT * FROM boards');
            const [postsRes, questsRes] = await Promise.all([
                db_1.pool.query('SELECT * FROM posts'),
                db_1.pool.query('SELECT * FROM quests'),
            ]);
            const posts = postsRes.rows.map((r) => ({
                ...r,
                authorId: r.authorid,
                createdAt: r.createdat,
            }));
            const quests = questsRes.rows.map((r) => ({
                ...r,
                authorId: r.authorid,
                createdAt: r.createdat,
            }));
            let boards = boardsResult.rows.map(b => ({ ...b, items: b.items || [] }));
            boards = boards.map(b => {
                if (userId && b.id === 'my-posts') {
                    b.items = posts
                        .filter(p => p.authorId === userId && p.systemGenerated !== true)
                        .sort((a, b) => (b.timestamp || b.createdAt || '').localeCompare(a.timestamp || a.createdAt || ''))
                        .map(p => p.id);
                }
                else if (userId && b.id === 'my-quests') {
                    b.items = quests.filter(q => q.authorId === userId).map(q => q.id);
                }
                else if (b.id === 'quest-board') {
                    b.items = getQuestBoardRequests(posts);
                }
                return b;
            });
            if (featured === 'true') {
                boards = boards.filter(b => b.featured === true);
            }
            if (enrich === 'true') {
                boards = boards.map(b => {
                    const enriched = (0, enrich_1.enrichBoard)(b, { posts, quests, currentUserId: userId || null });
                    return { ...enriched, layout: b.layout ?? 'grid', items: b.items };
                });
            }
            res.json(boards);
            return;
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
    }
    let boards = stores_1.boardsStore.read();
    if (boards.length === 0) {
        boards = boardContextDefaults_1.DEFAULT_BOARDS;
        stores_1.boardsStore.write(boards);
    }
    const posts = stores_1.postsStore.read();
    const quests = stores_1.questsStore.read();
    let result = boards.map(board => {
        if (userId && board.id === 'my-posts') {
            const filtered = posts
                .filter(p => p.authorId === userId &&
                p.systemGenerated !== true)
                .sort((a, b) => (b.timestamp || b.createdAt || '').localeCompare(a.timestamp || a.createdAt || ''))
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
            const items = getQuestBoardRequests(posts);
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
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { enrich, page = '1', limit, userId } = req.query;
    if (db_1.usePg) {
        try {
            const result = await db_1.pool.query('SELECT * FROM boards WHERE id = $1', [id]);
            const board = result.rows[0];
            if (!board) {
                res.status(404).json({ error: 'Board not found' });
                return;
            }
            board.items = board.items || [];
            if (enrich === 'true') {
                const [postsRes, questsRes] = await Promise.all([
                    db_1.pool.query('SELECT * FROM posts'),
                    db_1.pool.query('SELECT * FROM quests'),
                ]);
                const posts = postsRes.rows.map((r) => ({
                    ...r,
                    authorId: r.authorid,
                    createdAt: r.createdat,
                }));
                const quests = questsRes.rows.map((r) => ({
                    ...r,
                    authorId: r.authorid,
                    createdAt: r.createdat,
                }));
                const enriched = (0, enrich_1.enrichBoard)(board, { posts, quests, currentUserId: userId || null });
                res.json({ ...enriched, layout: board.layout ?? 'grid', items: board.items });
            }
            else {
                res.json(board);
            }
            return;
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
    }
    const boards = stores_1.boardsStore.read();
    const posts = stores_1.postsStore.read();
    const quests = stores_1.questsStore.read();
    const board = boards.find(b => b.id === id) || boardContextDefaults_1.DEFAULT_BOARDS.find(b => b.id === id);
    if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
    }
    const pageNum = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || constants_1.DEFAULT_PAGE_SIZE;
    const start = (pageNum - 1) * pageSize;
    const end = start + pageSize;
    let boardItems = board.items;
    let highlightMap = {};
    if (board.id === 'quest-board') {
        boardItems = getQuestBoardRequests(posts);
    }
    else if (board.id === 'timeline-board') {
        const userQuestIds = userId
            ? quests
                .filter(q => q.authorId === userId ||
                (q.collaborators || []).some(c => c.userId === userId) ||
                posts.some(p => p.questId === q.id && p.authorId === userId))
                .map(q => q.id)
            : [];
        const userTaskIds = userId
            ? posts
                .filter(p => p.authorId === userId && p.type === 'task')
                .map(p => p.id)
            : [];
        const withMeta = posts
            .filter(p => p.visibility !== 'private')
            .map(p => {
            let weight = 0;
            let highlight = false;
            if (userId) {
                if (p.questId && userQuestIds.includes(p.questId)) {
                    weight = p.type === 'task' ? 3 : 2;
                    if (p.type === 'task')
                        highlight = true;
                }
                else if (p.linkedItems?.some(li => (li.itemType === 'quest' && userQuestIds.includes(li.itemId)) ||
                    (li.itemType === 'post' && userTaskIds.includes(li.itemId)))) {
                    weight = 1;
                    highlight = true;
                }
            }
            return { id: p.id, timestamp: p.timestamp || '', weight, highlight };
        })
            .sort((a, b) => b.weight - a.weight || b.timestamp.localeCompare(a.timestamp));
        highlightMap = Object.fromEntries(withMeta.map(it => [it.id, it.highlight]));
        boardItems = withMeta.map(it => it.id);
    }
    else if (userId && board.id === 'my-posts') {
        boardItems = posts
            .filter(p => p.authorId === userId && p.systemGenerated !== true)
            .sort((a, b) => (b.timestamp || b.createdAt || '').localeCompare(a.timestamp || a.createdAt || ''))
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
            enrichedItems: enriched.enrichedItems.map(item => {
                if ('id' in item && highlightMap[item.id]) {
                    item.highlight = true;
                }
                return item;
            }),
        };
    }
    res.json(result);
});
//
// ✅ GET all items from a board (posts/quests)
//
router.get('/:id/items', async (req, res) => {
    const { id } = req.params;
    const { enrich, userId } = req.query;
    if (db_1.usePg) {
        try {
            const boardResult = await db_1.pool.query('SELECT * FROM boards WHERE id = $1', [id]);
            if (boardResult.rowCount === 0) {
                res.status(404).json({ error: 'Board not found' });
                return;
            }
            const board = boardResult.rows[0];
            board.items = board.items || [];
            const postsRes = await db_1.pool.query('SELECT * FROM posts');
            const questsRes = await db_1.pool.query('SELECT * FROM quests');
            const posts = postsRes.rows.map((r) => ({
                ...r,
                authorId: r.authorid,
                createdAt: r.createdat,
            }));
            const quests = questsRes.rows.map((r) => ({
                ...r,
                authorId: r.authorid,
                createdAt: r.createdat,
            }));
            let boardItems = board.items;
            let highlightMap = {};
            if (board.id === 'quest-board') {
                boardItems = getQuestBoardRequests(posts);
            }
            else if (board.id === 'timeline-board') {
                const userQuestIds = userId
                    ? quests
                        .filter(q => q.authorId === userId ||
                        (q.collaborators || []).some(c => c.userId === userId) ||
                        posts.some(p => p.questId === q.id && p.authorId === userId))
                        .map(q => q.id)
                    : [];
                const userTaskIds = userId
                    ? posts.filter(p => p.authorId === userId && p.type === 'task').map(p => p.id)
                    : [];
                const withMeta = posts
                    .filter(p => p.visibility !== 'private')
                    .map(p => {
                    let weight = 0;
                    let highlight = false;
                    if (userId) {
                        if (p.questId && userQuestIds.includes(p.questId)) {
                            weight = p.type === 'task' ? 3 : 2;
                            if (p.type === 'task')
                                highlight = true;
                        }
                        else if (p.linkedItems?.some(li => (li.itemType === 'quest' && userQuestIds.includes(li.itemId)) ||
                            (li.itemType === 'post' && userTaskIds.includes(li.itemId)))) {
                            weight = 1;
                            highlight = true;
                        }
                    }
                    return { id: p.id, timestamp: p.timestamp || '', weight, highlight };
                })
                    .sort((a, b) => b.weight - a.weight || b.timestamp.localeCompare(a.timestamp));
                highlightMap = Object.fromEntries(withMeta.map(it => [it.id, it.highlight]));
                boardItems = withMeta.map(it => it.id);
            }
            else if (userId && board.id === 'my-posts') {
                boardItems = posts
                    .filter(p => p.authorId === userId && p.systemGenerated !== true)
                    .sort((a, b) => (b.timestamp || b.createdAt || '').localeCompare(a.timestamp || a.createdAt || ''))
                    .map(p => p.id);
            }
            else if (userId && board.id === 'my-quests') {
                boardItems = quests.filter(q => q.authorId === userId).map(q => q.id);
            }
            if (enrich === 'true') {
                const enriched = (0, enrich_1.enrichBoard)({ ...board, items: boardItems }, { posts, quests, currentUserId: userId || null });
                const items = enriched.enrichedItems.map(item => {
                    if ('id' in item && highlightMap[item.id]) {
                        item.highlight = true;
                    }
                    return item;
                });
                res.json(items);
                return;
            }
            const items = boardItems
                .map(itemId => posts.find(p => p.id === itemId) || quests.find(q => q.id === itemId))
                .filter((i) => Boolean(i))
                .filter(item => {
                if ('type' in item) {
                    const p = item;
                    if (p.tags?.includes('archived'))
                        return false;
                    if (board.id === 'quest-board') {
                        if (p.type !== 'request')
                            return false;
                        if (p.visibility === 'private')
                            return false;
                        return true;
                    }
                    return true;
                }
                const q = item;
                if (board.id === 'quest-board')
                    return false;
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
            return;
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
    }
    const boards = stores_1.boardsStore.read();
    const posts = stores_1.postsStore.read();
    const quests = stores_1.questsStore.read();
    const board = boards.find((b) => b.id === id) || boardContextDefaults_1.DEFAULT_BOARDS.find(b => b.id === id);
    if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
    }
    let boardItems = board.items;
    let highlightMap = {};
    if (board.id === 'quest-board') {
        boardItems = getQuestBoardRequests(posts);
    }
    else if (board.id === 'timeline-board') {
        const userQuestIds = userId
            ? quests
                .filter(q => q.authorId === userId ||
                (q.collaborators || []).some(c => c.userId === userId) ||
                posts.some(p => p.questId === q.id && p.authorId === userId))
                .map(q => q.id)
            : [];
        const userTaskIds = userId
            ? posts
                .filter(p => p.authorId === userId && p.type === 'task')
                .map(p => p.id)
            : [];
        const withMeta = posts
            .filter(p => p.visibility !== 'private')
            .map(p => {
            let weight = 0;
            let highlight = false;
            if (userId) {
                if (p.questId && userQuestIds.includes(p.questId)) {
                    weight = p.type === 'task' ? 3 : 2;
                    if (p.type === 'task')
                        highlight = true;
                }
                else if (p.linkedItems?.some(li => (li.itemType === 'quest' && userQuestIds.includes(li.itemId)) ||
                    (li.itemType === 'post' && userTaskIds.includes(li.itemId)))) {
                    weight = 1;
                    highlight = true;
                }
            }
            return { id: p.id, timestamp: p.timestamp || '', weight, highlight };
        })
            .sort((a, b) => b.weight - a.weight || b.timestamp.localeCompare(a.timestamp));
        highlightMap = Object.fromEntries(withMeta.map(it => [it.id, it.highlight]));
        boardItems = withMeta.map(it => it.id);
    }
    else if (userId && board.id === 'my-posts') {
        boardItems = posts
            .filter(p => p.authorId === userId && p.systemGenerated !== true)
            .sort((a, b) => (b.timestamp || b.createdAt || '').localeCompare(a.timestamp || a.createdAt || ''))
            .map(p => p.id);
    }
    else if (userId && board.id === 'my-quests') {
        boardItems = quests.filter(q => q.authorId === userId).map(q => q.id);
    }
    if (enrich === 'true') {
        const enriched = (0, enrich_1.enrichBoard)({ ...board, items: boardItems }, { posts, quests, currentUserId: userId || null });
        const items = enriched.enrichedItems.map(item => {
            if ('id' in item && highlightMap[item.id]) {
                item.highlight = true;
            }
            return item;
        });
        res.json(items);
        return;
    }
    const items = boardItems
        .map((itemId) => posts.find((p) => p.id === itemId) || quests.find((q) => q.id === itemId))
        .filter((i) => Boolean(i))
        .filter((item) => {
        if ('type' in item) {
            const p = item;
            if (p.tags?.includes('archived'))
                return false;
            if (board.id === 'quest-board') {
                if (p.type !== 'request')
                    return false;
                if (p.visibility === 'private')
                    return false;
                return true;
            }
            return true;
        }
        const q = item;
        if (board.id === 'quest-board')
            return false;
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
    const board = boards.find((b) => b.id === id) || boardContextDefaults_1.DEFAULT_BOARDS.find(b => b.id === id);
    if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
    }
    let boardItems = board.items;
    if (board.id === 'quest-board') {
        boardItems = getQuestBoardQuests(quests, userId).filter(id => quests.find(q => q.id === id));
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
router.post('/', authMiddleware_1.authMiddleware, async (req, res) => {
    if (db_1.usePg) {
        const { id: customId, title, description = '', items = [], filters = {}, featured = false, defaultFor = null, layout = 'grid', boardType = 'post', questId, } = req.body;
        const id = customId || (0, uuid_1.v4)();
        try {
            await db_1.pool.query('INSERT INTO boards (id, title, description, boardType, layout, items, filters, featured, defaultFor, createdAt, userId, questId) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)', [
                id,
                title,
                description,
                boardType,
                layout,
                JSON.stringify(items),
                JSON.stringify(filters),
                featured,
                defaultFor,
                new Date().toISOString(),
                req.user?.id || '',
                questId,
            ]);
            const newBoard = {
                id,
                title,
                description,
                boardType,
                items,
                filters,
                featured,
                defaultFor,
                layout,
                createdAt: new Date().toISOString(),
                userId: req.user?.id || '',
                questId,
            };
            res.status(201).json(newBoard);
            return;
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
    }
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
router.patch('/:id', authMiddleware_1.authMiddleware, async (req, res) => {
    if (db_1.usePg) {
        try {
            const fields = Object.keys(req.body);
            const values = Object.values(req.body);
            if (fields.length > 0) {
                const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
                values.push(req.params.id);
                const result = await db_1.pool.query(`UPDATE boards SET ${sets} WHERE id = $${fields.length + 1} RETURNING *`, values);
                if (result.rows.length === 0) {
                    res.status(404).json({ error: 'Board not found' });
                    return;
                }
                res.json(result.rows[0]);
                return;
            }
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
    }
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
router.delete('/:id', authMiddleware_1.authMiddleware, async (req, res) => {
    if (db_1.usePg) {
        try {
            const result = await db_1.pool.query('DELETE FROM boards WHERE id = $1 RETURNING *', [req.params.id]);
            const removed = result.rows[0];
            if (!removed) {
                res.status(404).json({ error: 'Board not found' });
                return;
            }
            res.json(removed);
            return;
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
    }
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
