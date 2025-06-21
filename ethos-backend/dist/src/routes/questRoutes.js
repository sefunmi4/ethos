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
const enrich_1 = require("../utils/enrich");
const nodeIdUtils_1 = require("../utils/nodeIdUtils");
const errorTracker_1 = require("../utils/errorTracker");
const makeQuestNodeTitle = (content) => {
    const text = content.trim();
    return text.length <= 50 ? text : text.slice(0, 50) + '…';
};
const router = express_1.default.Router();
// GET top 10 featured quests
router.get('/featured', authOptional_1.default, (req, res) => {
    const { userId } = req.query;
    const quests = stores_1.questsStore.read();
    const posts = stores_1.postsStore.read();
    const popularity = (q) => posts.filter((p) => p.questId === q.id).length + (q.linkedPosts?.length || 0);
    const featured = quests
        .filter((q) => q.visibility === 'public' && q.approvalStatus === 'approved')
        .filter((q) => {
        if (!userId)
            return true;
        const involved = q.authorId === userId ||
            (q.collaborators || []).some((c) => c.userId === userId) ||
            posts.some((p) => p.questId === q.id && p.authorId === userId);
        return !involved;
    })
        .sort((a, b) => popularity(b) - popularity(a))
        .slice(0, 10)
        .map((q) => ({
        ...q,
        popularity: popularity(q),
        gitRepo: q.gitRepo ? { repoUrl: q.gitRepo.repoUrl ?? '', ...q.gitRepo } : undefined,
    }));
    res.json(featured);
});
// GET active quests (optionally excluding a user)
router.get('/active', authOptional_1.default, (req, res) => {
    const { userId } = req.query;
    const quests = stores_1.questsStore.read();
    const posts = stores_1.postsStore.read();
    const active = quests
        .filter((q) => q.status === 'active' && q.visibility === 'public')
        .filter((q) => {
        if (!userId)
            return true;
        const involved = q.authorId === userId ||
            (q.collaborators || []).some((c) => c.userId === userId) ||
            posts.some((p) => p.questId === q.id && p.authorId === userId);
        return !involved;
    })
        .map((q) => ({
        ...q,
        gitRepo: q.gitRepo ? { repoUrl: q.gitRepo.repoUrl ?? '', ...q.gitRepo } : undefined,
    }));
    res.json(active);
});
// GET all quests
router.get('/', (req, res) => {
    const quests = stores_1.questsStore.read().map((q) => ({
        ...q,
        gitRepo: q.gitRepo ? { repoUrl: q.gitRepo.repoUrl ?? '', ...q.gitRepo } : undefined,
    }));
    res.json(quests);
});
// CREATE a new quest
router.post('/', authMiddleware_1.authMiddleware, (req, res) => {
    const { title, description = '', tags = [], fromPostId = '', headType = 'log', taskType = 'folder', helpRequest = false, } = req.body;
    const authorId = req.user?.id;
    if (!authorId || !title) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    const newQuest = {
        id: (0, uuid_1.v4)(),
        authorId,
        title,
        description,
        displayOnBoard: req.body.displayOnBoard ?? true,
        visibility: 'public',
        approvalStatus: 'approved',
        flagCount: 0,
        tags,
        linkedPosts: fromPostId
            ? [{ itemId: fromPostId, itemType: 'post' }]
            : [],
        collaborators: [],
        status: 'active',
        headPostId: '',
        taskGraph: [],
        helpRequest,
    };
    const posts = stores_1.postsStore.read();
    const rootContent = `${title}${description ? `\n\n${description}` : ''}`.trim();
    const headPost = {
        id: (0, uuid_1.v4)(),
        authorId,
        type: headType === 'task' ? 'task' : 'log',
        ...(headType === 'task' ? { taskType } : {}),
        content: rootContent,
        visibility: 'public',
        timestamp: new Date().toISOString(),
        tags: [],
        collaborators: [],
        replyTo: null,
        repostedFrom: null,
        linkedItems: [],
        questId: newQuest.id,
        nodeId: (0, nodeIdUtils_1.generateNodeId)({ quest: newQuest, posts, postType: headType === 'task' ? 'task' : 'log', parentPost: null }),
        questNodeTitle: makeQuestNodeTitle(rootContent),
    };
    posts.push(headPost);
    stores_1.postsStore.write(posts);
    newQuest.headPostId = headPost.id;
    const quests = stores_1.questsStore.read();
    const dbQuest = {
        ...newQuest,
        gitRepo: newQuest.gitRepo
            ? {
                repoId: newQuest.gitRepo.repoId,
                repoUrl: newQuest.gitRepo.repoUrl,
                headCommitId: newQuest.gitRepo.headCommitId,
                defaultBranch: newQuest.gitRepo.defaultBranch,
            }
            : undefined,
        helpRequest,
        displayOnBoard: newQuest.displayOnBoard,
    };
    quests.push(dbQuest);
    stores_1.questsStore.write(quests);
    // Create default map board for quest
    const boards = stores_1.boardsStore.read();
    boards.push({
        id: `map-${newQuest.id}`,
        title: `${newQuest.title} Map`,
        description: '',
        boardType: 'map',
        layout: 'graph',
        items: newQuest.headPostId ? [newQuest.headPostId] : [],
        filters: {},
        featured: false,
        createdAt: new Date().toISOString(),
        userId: authorId,
        questId: newQuest.id,
    });
    stores_1.boardsStore.write(boards);
    res.status(201).json(newQuest);
});
// PATCH quest (e.g. add a log)
router.patch('/:id', (req, res) => {
    const { id } = req.params;
    const { itemId, gitRepo, title, description, tags, displayOnBoard } = req.body;
    const quests = stores_1.questsStore.read();
    const quest = quests.find(q => q.id === id);
    if (!quest) {
        (0, errorTracker_1.logQuest404)(id, req.originalUrl);
        res.status(404).json({ error: 'Quest not found' });
        return;
    }
    if (itemId) {
        const posts = stores_1.postsStore.read();
        const post = posts.find(p => p.id === itemId);
        if (post && post.type === 'free_speech') {
            post.type = 'quest_log';
            post.subtype = 'comment';
            post.questId = id;
            stores_1.postsStore.write(posts);
        }
        quest.linkedPosts = quest.linkedPosts || [];
        const exists = quest.linkedPosts.some(l => l.itemId === itemId);
        if (!exists) {
            quest.linkedPosts.push({ itemId, itemType: 'post' });
            if (post && post.type === 'task') {
                quest.taskGraph = quest.taskGraph || [];
                const edgeExists = quest.taskGraph.some(e => e.to === itemId);
                if (!edgeExists) {
                    quest.taskGraph.push({ from: quest.headPostId, to: itemId });
                }
            }
        }
    }
    if (title !== undefined)
        quest.title = title;
    if (description !== undefined)
        quest.description = description;
    if (tags !== undefined)
        quest.tags = tags;
    if (displayOnBoard !== undefined)
        quest.displayOnBoard = displayOnBoard;
    if (gitRepo && typeof gitRepo.repoUrl === 'string') {
        quest.gitRepo = { ...(quest.gitRepo || { repoId: '' }), ...quest.gitRepo, repoUrl: gitRepo.repoUrl };
    }
    stores_1.questsStore.write(quests);
    res.json(quest);
});
// GET posts linked to a quest
router.get('/:id/posts', authOptional_1.default, (req, res) => {
    const { id } = req.params;
    const posts = stores_1.postsStore.read();
    const users = stores_1.usersStore.read();
    const filtered = posts.filter((p) => p.questId === id);
    res.json(filtered.map((p) => (0, enrich_1.enrichPost)(p, { users, currentUserId: req.user?.id || null })));
});
// POST flag a quest for moderation
router.post('/:id/flag', authMiddleware_1.authMiddleware, (req, res) => {
    const { id } = req.params;
    const quests = stores_1.questsStore.read();
    const posts = stores_1.postsStore.read();
    const quest = quests.find(q => q.id === id);
    if (!quest) {
        (0, errorTracker_1.logQuest404)(id, req.originalUrl);
        res.status(404).json({ error: 'Quest not found' });
        return;
    }
    quest.flagCount = (quest.flagCount || 0) + 1;
    if (quest.flagCount >= 3 && quest.approvalStatus === 'approved') {
        quest.approvalStatus = 'flagged';
        const reviewPost = {
            id: (0, uuid_1.v4)(),
            authorId: req.user.id,
            type: 'meta_system',
            subtype: 'mod_review',
            content: `Quest ${quest.id} flagged for review`,
            visibility: 'hidden',
            timestamp: new Date().toISOString(),
            tags: ['mod_review'],
            collaborators: [],
            replyTo: null,
            repostedFrom: null,
            linkedItems: [{ itemId: quest.id, itemType: 'quest' }],
        };
        posts.push(reviewPost);
        stores_1.postsStore.write(posts);
    }
    stores_1.questsStore.write(quests);
    res.json({ success: true, flags: quest.flagCount });
});
// GET task graph map for a quest
router.get('/:id/map', authOptional_1.default, (req, res) => {
    const { id } = req.params;
    const quests = stores_1.questsStore.read();
    const quest = quests.find((q) => q.id === id);
    if (!quest) {
        (0, errorTracker_1.logQuest404)(id, req.originalUrl);
        res.status(404).json({ error: 'Quest not found' });
        return;
    }
    const posts = stores_1.postsStore.read();
    const users = stores_1.usersStore.read();
    const nodes = posts
        .filter((p) => p.questId === id)
        .map((p) => (0, enrich_1.enrichPost)(p, { users, currentUserId: req.user?.id || null }));
    res.json({ nodes, edges: quest.taskGraph || [] });
});
// GET enriched quest
router.get('/:id', authOptional_1.default, async (req, res) => {
    const { id } = req.params;
    const { enrich } = req.query;
    const userId = req.user?.id || null;
    const quests = stores_1.questsStore.read();
    const quest = quests.find((q) => q.id === id);
    if (!quest) {
        (0, errorTracker_1.logQuest404)(id, req.originalUrl);
        res.status(404).json({ error: 'Quest not found' });
        return;
    }
    if (enrich === 'true') {
        const posts = stores_1.postsStore.read();
        const users = stores_1.usersStore.read();
        const enriched = (0, enrich_1.enrichQuest)(quest, { posts, users, currentUserId: userId });
        res.json(enriched);
        return;
    }
    res.json(quest);
});
// POST to link a post to quest
router.post('/:id/link', authMiddleware_1.authMiddleware, (req, res) => {
    const { id } = req.params;
    const { postId, parentId, edgeType, edgeLabel, title } = req.body;
    if (!postId) {
        res.status(400).json({ error: 'Missing postId' });
        return;
    }
    const quests = stores_1.questsStore.read();
    const quest = quests.find(q => q.id === id);
    if (!quest) {
        (0, errorTracker_1.logQuest404)(id, req.originalUrl);
        res.status(404).json({ error: 'Quest not found' });
        return;
    }
    const posts = stores_1.postsStore.read();
    const post = posts.find(p => p.id === postId);
    if (post && post.type === 'free_speech') {
        post.type = 'quest_log';
        post.subtype = 'comment';
        post.questId = id;
        stores_1.postsStore.write(posts);
    }
    quest.linkedPosts = quest.linkedPosts || [];
    const alreadyLinked = quest.linkedPosts.some(p => p.itemId === postId);
    if (!alreadyLinked) {
        quest.linkedPosts.push({ itemId: postId, itemType: 'post', title });
        if (post && post.type === 'task') {
            quest.taskGraph = quest.taskGraph || [];
            const from = parentId || quest.headPostId;
            const edgeExists = quest.taskGraph.some(e => e.to === postId && e.from === from);
            if (!edgeExists) {
                quest.taskGraph.push({ from, to: postId, type: edgeType, label: edgeLabel });
            }
        }
        stores_1.questsStore.write(quests);
    }
    res.json(quest);
});
// POST add a collaborator or open role
router.post('/:id/collaborators', authMiddleware_1.authMiddleware, (req, res) => {
    const { id } = req.params;
    const { userId, roles = [] } = req.body;
    const quests = stores_1.questsStore.read();
    const users = stores_1.usersStore.read();
    const quest = quests.find(q => q.id === id);
    if (!quest) {
        (0, errorTracker_1.logQuest404)(id, req.originalUrl);
        res.status(404).json({ error: 'Quest not found' });
        return;
    }
    if (userId && !users.find(u => u.id === userId)) {
        res.status(400).json({ error: 'User not found' });
        return;
    }
    quest.collaborators = quest.collaborators || [];
    quest.collaborators.push({ userId, roles });
    stores_1.questsStore.write(quests);
    res.json(quest);
});
// GET quest tree (hierarchy)
router.get('/:id/tree', authOptional_1.default, (req, res) => {
    const { id } = req.params;
    const quests = stores_1.questsStore.read();
    const posts = stores_1.postsStore.read();
    const quest = quests.find(q => q.id === id);
    if (!quest) {
        (0, errorTracker_1.logQuest404)(id, req.originalUrl);
        res.status(404).json({ error: 'Quest not found' });
        return;
    }
    const nodes = [];
    const recurse = (questId) => {
        const q = quests.find(x => x.id === questId);
        if (q) {
            nodes.push({ ...q, type: 'quest' });
            q.linkedPosts
                .filter(l => l.itemType === 'quest')
                .forEach(l => recurse(l.itemId));
        }
        const postChildren = posts.filter(p => p.questId === questId && p.type === 'task');
        postChildren.forEach(p => nodes.push({ ...p, type: 'post' }));
    };
    recurse(id);
    res.json(nodes);
});
// POST mark quest complete and cascade solution
router.post('/:id/complete', authMiddleware_1.authMiddleware, (req, res) => {
    const { id } = req.params;
    const quests = stores_1.questsStore.read();
    const posts = stores_1.postsStore.read();
    const visited = new Set();
    const markCompleted = (questId) => {
        if (visited.has(questId))
            return;
        visited.add(questId);
        const quest = quests.find((q) => q.id === questId);
        if (!quest)
            return;
        quest.status = 'completed';
        (quest.linkedPosts || []).forEach((link) => {
            if (link.itemType === 'post') {
                const post = posts.find((p) => p.id === link.itemId);
                if (post && link.cascadeSolution) {
                    post.tags = Array.from(new Set([...(post.tags || []), 'solved']));
                }
                if (link.notifyOnChange) {
                    console.log(`Notify link change for post ${link.itemId} from quest ${questId}`);
                }
            }
            else if (link.itemType === 'quest') {
                if (link.cascadeSolution) {
                    markCompleted(link.itemId);
                }
                else if (link.notifyOnChange) {
                    console.log(`Notify link change for quest ${link.itemId} from quest ${questId}`);
                }
            }
        });
    };
    const quest = quests.find((q) => q.id === id);
    if (!quest) {
        (0, errorTracker_1.logQuest404)(id, req.originalUrl);
        res.status(404).json({ error: 'Quest not found' });
        return;
    }
    markCompleted(id);
    stores_1.questsStore.write(quests);
    stores_1.postsStore.write(posts);
    res.json(quest);
});
// PATCH quest visibility or approval status by moderators
router.patch('/:id/moderate', authMiddleware_1.authMiddleware, (req, res) => {
    const { id } = req.params;
    const { visibility, approvalStatus } = req.body;
    const quests = stores_1.questsStore.read();
    const users = stores_1.usersStore.read();
    const quest = quests.find(q => q.id === id);
    if (!quest) {
        (0, errorTracker_1.logQuest404)(id, req.originalUrl);
        res.status(404).json({ error: 'Quest not found' });
        return;
    }
    const user = users.find(u => u.id === req.user.id);
    if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    if (visibility)
        quest.visibility = visibility;
    if (approvalStatus)
        quest.approvalStatus = approvalStatus;
    stores_1.questsStore.write(quests);
    res.json(quest);
});
// DELETE quest
router.delete('/:id', authMiddleware_1.authMiddleware, (req, res) => {
    const { id } = req.params;
    const quests = stores_1.questsStore.read();
    const index = quests.findIndex(q => q.id === id);
    if (index === -1) {
        (0, errorTracker_1.logQuest404)(id, req.originalUrl);
        res.status(404).json({ error: 'Quest not found' });
        return;
    }
    quests.splice(index, 1);
    stores_1.questsStore.write(quests);
    res.json({ success: true });
});
exports.default = router;
