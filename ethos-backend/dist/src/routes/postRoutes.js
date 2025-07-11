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
const makeQuestNodeTitle = (content) => {
    const text = content.trim();
    // TODO: Replace simple truncation with AI-generated summaries
    return text.length <= 50 ? text : text.slice(0, 50) + '…';
};
const router = express_1.default.Router();
//
// ✅ GET all posts
//
router.get('/', authOptional_1.default, (_req, res) => {
    const posts = stores_1.postsStore.read();
    const users = stores_1.usersStore.read();
    res.json(posts.map((p) => (0, enrich_1.enrichPost)(p, { users, currentUserId: _req.user?.id || null })));
});
// GET recent posts. If userId is provided, return posts related to that user.
router.get('/recent', authOptional_1.default, (req, res) => {
    const { userId } = req.query;
    const posts = stores_1.postsStore.read();
    const quests = stores_1.questsStore.read();
    const users = stores_1.usersStore.read();
    let filtered = [];
    if (userId) {
        // Posts authored by the user
        const authored = posts.filter(p => p.authorId === userId);
        // Posts in quests the user authored or collaborates on
        const relatedQuestIds = quests
            .filter(q => q.authorId === userId ||
            (q.collaborators || []).some(c => c.userId === userId))
            .map(q => q.id);
        const questPosts = posts.filter(p => p.questId && relatedQuestIds.includes(p.questId));
        const userPostIds = new Set(authored.map(p => p.id));
        // Posts linking to any post by the user
        const linked = posts.filter(p => (p.linkedItems || []).some(li => li.itemType === 'post' && userPostIds.has(li.itemId)));
        // Posts replying to any post by the user
        const replies = posts.filter(p => p.replyTo && userPostIds.has(p.replyTo));
        // Posts in quests that contain any user-authored post
        const userQuestIds = new Set(authored.map(p => p.questId).filter((id) => Boolean(id)));
        const questActivity = posts.filter(p => p.questId && userQuestIds.has(p.questId));
        filtered = [
            ...authored,
            ...questPosts,
            ...linked,
            ...replies,
            ...questActivity,
        ];
    }
    else {
        // Public recent posts across the site
        filtered = posts.filter(p => p.visibility === 'public' ||
            p.visibility === 'request_board' ||
            p.needsHelp === true);
    }
    const recent = filtered
        .filter(p => p.type !== 'meta_system' && p.systemGenerated !== true)
        .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
        .slice(0, 20)
        .map(p => (0, enrich_1.enrichPost)(p, { users, currentUserId: userId || null }));
    res.json(recent);
});
//
// ✅ GET a single post by ID
//
//
// ✅ POST create a new post
//
router.post('/', authMiddleware_1.authMiddleware, (req, res) => {
    const { type = 'free_speech', title = '', content = '', details = '', visibility = 'public', tags = [], questId = null, replyTo = null, linkedItems = [], collaborators = [], status, boardId, taskType = 'abstract', helpRequest = false, needsHelp = undefined, } = req.body;
    const finalStatus = status ?? (['task', 'request', 'issue'].includes(type) ? 'To Do' : undefined);
    const posts = stores_1.postsStore.read();
    const quests = stores_1.questsStore.read();
    const quest = questId ? quests.find(q => q.id === questId) : null;
    const parent = replyTo ? posts.find(p => p.id === replyTo) : null;
    if (boardId === 'quest-board') {
        if (type !== 'request') {
            res
                .status(400)
                .json({ error: 'Only request posts allowed on this board' });
            return;
        }
    }
    const newPost = {
        id: (0, uuid_1.v4)(),
        authorId: req.user.id,
        type,
        title: type === 'task' ? content : title || makeQuestNodeTitle(content),
        content,
        details,
        visibility,
        timestamp: new Date().toISOString(),
        tags,
        collaborators,
        replyTo,
        repostedFrom: null,
        linkedItems,
        questId,
        ...(type === 'task' ? { taskType } : {}),
        status: finalStatus,
        helpRequest: type === 'request' || helpRequest,
        needsHelp: type === 'request' ? needsHelp ?? true : undefined,
        nodeId: quest ? (0, nodeIdUtils_1.generateNodeId)({ quest, posts, postType: type, parentPost: parent }) : undefined,
    };
    if (questId && (!newPost.questNodeTitle || newPost.questNodeTitle.trim() === '')) {
        newPost.questNodeTitle = makeQuestNodeTitle(content);
    }
    posts.push(newPost);
    stores_1.postsStore.write(posts);
    if (questId && type === 'task') {
        const quest = quests.find((q) => q.id === questId);
        if (quest) {
            quest.taskGraph = quest.taskGraph || [];
            const from = quest.headPostId || '';
            const exists = quest.taskGraph.some((e) => e.from === from && e.to === newPost.id);
            if (!exists) {
                quest.taskGraph.push({ from, to: newPost.id });
            }
            stores_1.questsStore.write(quests);
        }
    }
    const users = stores_1.usersStore.read();
    res.status(201).json((0, enrich_1.enrichPost)(newPost, { users }));
});
//
// ✅ PATCH update post
//
router.patch('/:id', authMiddleware_1.authMiddleware, (req, res) => {
    const posts = stores_1.postsStore.read();
    const quests = stores_1.questsStore.read();
    const post = posts.find((p) => p.id === req.params.id);
    if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
    }
    if ((post.type === 'meta_system' || post.systemGenerated === true) &&
        req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Cannot modify system post' });
        return;
    }
    const originalQuestId = post.questId;
    const originalReplyTo = post.replyTo;
    const originalType = post.type;
    Object.assign(post, req.body);
    if (post.type === 'task') {
        post.title = post.content;
    }
    else if (post.type !== 'free_speech' && (!post.title || post.title.trim() === '')) {
        post.title = makeQuestNodeTitle(post.content);
    }
    if (post.questId &&
        (!post.questNodeTitle || post.questNodeTitle.trim() === '')) {
        post.questNodeTitle = makeQuestNodeTitle(post.content);
    }
    const questIdChanged = 'questId' in req.body && req.body.questId !== originalQuestId;
    const replyToChanged = 'replyTo' in req.body && req.body.replyTo !== originalReplyTo;
    const typeChanged = 'type' in req.body && req.body.type !== originalType;
    if (questIdChanged || replyToChanged || typeChanged) {
        const quest = post.questId
            ? quests.find((q) => q.id === post.questId)
            : null;
        const parent = post.replyTo
            ? posts.find((p) => p.id === post.replyTo) || null
            : null;
        const otherPosts = posts.filter((p) => p.id !== post.id);
        post.nodeId = quest
            ? (0, nodeIdUtils_1.generateNodeId)({
                quest,
                posts: otherPosts,
                postType: post.type,
                parentPost: parent,
            })
            : undefined;
    }
    stores_1.postsStore.write(posts);
    const users = stores_1.usersStore.read();
    res.json((0, enrich_1.enrichPost)(post, { users }));
});
//
// ✅ GET /api/posts/:id/replies – Fetch direct replies to a post
//
router.get('/:id/replies', (req, res) => {
    const posts = stores_1.postsStore.read();
    const replies = posts.filter((p) => p.replyTo === req.params.id);
    const users = stores_1.usersStore.read();
    res.json({ replies: replies.map((p) => (0, enrich_1.enrichPost)(p, { users })) });
});
//
// ✅ POST /api/posts/:id/repost – Repost a post
//
//
// ✅ POST /api/posts/:id/repost – Repost a post
//
router.post('/:id/repost', authMiddleware_1.authMiddleware, (req, res) => {
    const posts = stores_1.postsStore.read();
    const original = posts.find((p) => p.id === req.params.id);
    if (!original)
        return void res.status(404).json({ error: 'Original post not found' });
    const users = stores_1.usersStore.read();
    const authorUsername = users.find(u => u.id === req.user.id)?.username || '';
    const originalAuthorUsername = users.find(u => u.id === original.authorId)?.username || '';
    const repost = {
        id: (0, uuid_1.v4)(),
        authorId: req.user.id,
        type: original.type,
        content: original.content,
        visibility: original.visibility,
        questId: original.questId || null,
        tags: [...(original.tags || [])],
        collaborators: [], // reposts are solo unless explicitly assigned
        replyTo: null,
        timestamp: new Date().toISOString(),
        repostedFrom: original.id,
        linkedItems: [...(original.linkedItems || [])],
        // 🧹 Clear non-transferable or enriched fields
        enriched: false,
        systemGenerated: false,
        autoGeneratedReason: undefined,
        status: undefined,
        questNodeTitle: undefined,
        nodeId: undefined,
        linkedNodeId: undefined,
        gitDiff: undefined,
        commitSummary: undefined,
        reactions: undefined,
        reactionCounts: undefined,
    };
    posts.push(repost);
    stores_1.postsStore.write(posts);
    res.status(201).json((0, enrich_1.enrichPost)(repost, { users }));
});
//
// ✅ DELETE /api/posts/:id/repost – Remove current user's repost
//
router.delete('/:id/repost', authMiddleware_1.authMiddleware, (req, res) => {
    const posts = stores_1.postsStore.read();
    const index = posts.findIndex((p) => p.repostedFrom === req.params.id && p.authorId === req.user.id);
    if (index === -1) {
        res.status(404).json({ error: 'Repost not found' });
        return;
    }
    const [removed] = posts.splice(index, 1);
    stores_1.postsStore.write(posts);
    res.json({ success: true, id: removed.id });
});
//
// ✅ GET /api/posts/:id/reposts/user – Get current user's repost of a post
//
router.get('/:id/reposts/user', authMiddleware_1.authMiddleware, (req, res) => {
    const posts = stores_1.postsStore.read();
    const repost = posts.find((p) => p.repostedFrom === req.params.id && p.authorId === req.user.id);
    const users = stores_1.usersStore.read();
    res.json(repost ? (0, enrich_1.enrichPost)(repost, { users }) : null);
});
//
// ✅ GET /api/posts/:id/reposts/count – Count of reposts
//
router.get('/:id/reposts/count', (_req, res) => {
    const posts = stores_1.postsStore.read();
    const count = posts.filter((p) => p.repostedFrom === _req.params.id).length;
    res.json({ count });
});
//
// ✅ POST /api/posts/:id/reactions/:type – Toggle reaction (like/heart)
//
router.post('/:id/reactions/:type', authMiddleware_1.authMiddleware, (req, res) => {
    const { id, type } = req.params;
    const userId = req.user.id;
    const reactions = stores_1.reactionsStore.read();
    const key = `${id}_${userId}_${type}`;
    if (!reactions.includes(key)) {
        reactions.push(key);
        stores_1.reactionsStore.write(reactions);
    }
    res.json({ success: true });
});
//
// ✅ DELETE /api/posts/:id/reactions/:type – Remove reaction
//
router.delete('/:id/reactions/:type', authMiddleware_1.authMiddleware, (req, res) => {
    const { id, type } = req.params;
    const userId = req.user.id;
    const reactions = stores_1.reactionsStore.read();
    const index = reactions.indexOf(`${id}_${userId}_${type}`);
    if (index !== -1) {
        reactions.splice(index, 1);
        stores_1.reactionsStore.write(reactions);
    }
    res.json({ success: true });
});
//
// ✅ GET /api/posts/:id/reactions – Get all reactions on a post
//
router.get('/:id/reactions', (req, res) => {
    const { id } = req.params;
    const reactions = stores_1.reactionsStore.read();
    const postReactions = reactions
        .filter((r) => r.startsWith(`${id}_`))
        .map((r) => {
        const [, userId, type] = r.split('_');
        return { userId, type };
    });
    res.json(postReactions);
});
//
// ✅ POST /api/tasks/:id/request-help – Create a help request from a task
//
router.post('/tasks/:id/request-help', authMiddleware_1.authMiddleware, (req, res) => {
    const posts = stores_1.postsStore.read();
    const task = posts.find((p) => p.id === req.params.id && p.type === 'task');
    if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
    }
    const requestPost = {
        id: (0, uuid_1.v4)(),
        authorId: req.user.id,
        type: 'request',
        content: task.content,
        visibility: task.visibility,
        timestamp: new Date().toISOString(),
        tags: [],
        collaborators: [],
        replyTo: null,
        repostedFrom: null,
        linkedItems: [
            { itemId: task.id, itemType: 'post', linkType: 'reference' },
        ],
        questId: task.questId || null,
        helpRequest: true,
        needsHelp: true,
    };
    posts.push(requestPost);
    stores_1.postsStore.write(posts);
    const users = stores_1.usersStore.read();
    res.status(201).json((0, enrich_1.enrichPost)(requestPost, { users }));
});
//
// ✅ POST /api/posts/:id/request-help – Create a help request from any post
//
router.post('/:id/request-help', authMiddleware_1.authMiddleware, (req, res) => {
    const posts = stores_1.postsStore.read();
    const original = posts.find((p) => p.id === req.params.id);
    if (!original) {
        res.status(404).json({ error: 'Post not found' });
        return;
    }
    const requestPost = {
        id: (0, uuid_1.v4)(),
        authorId: req.user.id,
        type: 'request',
        content: original.content,
        visibility: original.visibility,
        timestamp: new Date().toISOString(),
        tags: [],
        collaborators: [],
        replyTo: null,
        repostedFrom: null,
        linkedItems: [
            { itemId: original.id, itemType: 'post', linkType: 'reference' },
        ],
        questId: original.questId || null,
        helpRequest: true,
        needsHelp: true,
    };
    posts.push(requestPost);
    stores_1.postsStore.write(posts);
    const users = stores_1.usersStore.read();
    res.status(201).json((0, enrich_1.enrichPost)(requestPost, { users }));
});
//
// ✅ POST /api/posts/:id/accept – Accept a help request
// Marks the post as pending for the current user and joins or creates a quest
//
router.post('/:id/accept', authMiddleware_1.authMiddleware, (req, res) => {
    const posts = stores_1.postsStore.read();
    const quests = stores_1.questsStore.read();
    const post = posts.find(p => p.id === req.params.id);
    if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
    }
    const userId = req.user.id;
    post.tags = Array.from(new Set([...(post.tags || []), `pending:${userId}`]));
    let quest = post.questId ? quests.find(q => q.id === post.questId) : null;
    if (quest) {
        const exists = (quest.collaborators || []).some(c => c.userId === userId);
        if (!exists) {
            quest.collaborators = quest.collaborators || [];
            quest.collaborators.push({ userId });
        }
    }
    else {
        quest = {
            id: (0, uuid_1.v4)(),
            authorId: userId,
            title: makeQuestNodeTitle(post.content),
            description: '',
            visibility: 'public',
            approvalStatus: 'approved',
            flagCount: 0,
            status: 'active',
            headPostId: post.id,
            linkedPosts: [],
            collaborators: [{ userId }],
            createdAt: new Date().toISOString(),
            tags: [],
            displayOnBoard: true,
            taskGraph: [],
            helpRequest: true,
        };
        quests.push(quest);
        post.questId = quest.id;
        post.questNodeTitle = makeQuestNodeTitle(post.content);
    }
    stores_1.questsStore.write(quests);
    stores_1.postsStore.write(posts);
    const users = stores_1.usersStore.read();
    res.json({ post: (0, enrich_1.enrichPost)(post, { users }), quest });
});
//
// ✅ POST /api/posts/:id/unaccept – Cancel a help request acceptance
// Removes the pending tag for the current user
//
router.post('/:id/unaccept', authMiddleware_1.authMiddleware, (req, res) => {
    const posts = stores_1.postsStore.read();
    const post = posts.find(p => p.id === req.params.id);
    if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
    }
    const userId = req.user.id;
    post.tags = (post.tags || []).filter(t => t !== `pending:${userId}`);
    stores_1.postsStore.write(posts);
    const users = stores_1.usersStore.read();
    res.json({ post: (0, enrich_1.enrichPost)(post, { users }) });
});
//
// ✅ POST /api/posts/:id/unaccept – Undo accepting a help request
// Removes the pending tag for the current user
//
router.post('/:id/unaccept', authMiddleware_1.authMiddleware, (req, res) => {
    const posts = stores_1.postsStore.read();
    const post = posts.find(p => p.id === req.params.id);
    if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
    }
    const userId = req.user.id;
    post.tags = (post.tags || []).filter(t => t !== `pending:${userId}`);
    stores_1.postsStore.write(posts);
    const users = stores_1.usersStore.read();
    res.json({ post: (0, enrich_1.enrichPost)(post, { users }) });
});
//
// ✅ POST /api/posts/:id/solve – Mark a post as solved
//
router.post('/:id/solve', authMiddleware_1.authMiddleware, (req, res) => {
    const posts = stores_1.postsStore.read();
    const post = posts.find((p) => p.id === req.params.id);
    if (!post)
        return void res.status(404).json({ error: 'Post not found' });
    post.tags = [...(post.tags || []), 'solved'];
    stores_1.postsStore.write(posts);
    res.json({ success: true });
});
//
// ✅ POST /api/posts/:id/archive – Archive a post
//
router.post('/:id/archive', authMiddleware_1.authMiddleware, (req, res) => {
    const posts = stores_1.postsStore.read();
    const post = posts.find((p) => p.id === req.params.id);
    if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
    }
    post.tags = Array.from(new Set([...(post.tags || []), 'archived']));
    stores_1.postsStore.write(posts);
    res.json({ success: true });
});
//
// ✅ DELETE /api/posts/:id – Permanently remove a post
//
router.delete('/:id', authMiddleware_1.authMiddleware, (req, res) => {
    const posts = stores_1.postsStore.read();
    const quests = stores_1.questsStore.read();
    const index = posts.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
        res.status(404).json({ error: 'Post not found' });
        return;
    }
    const post = posts[index];
    if (post.questId) {
        const questIndex = quests.findIndex((q) => q.id === post.questId && q.headPostId === post.id);
        if (questIndex !== -1) {
            // Deleting the head post deletes the entire quest instead
            const [removedQuest] = quests.splice(questIndex, 1);
            stores_1.questsStore.write(quests);
            res.json({ success: true, questDeleted: removedQuest.id });
            return;
        }
    }
    posts.splice(index, 1);
    stores_1.postsStore.write(posts);
    res.json({ success: true });
});
//
// ✅ GET /api/posts/:id/linked – Get all posts linked to a post
//
router.get('/:id/linked', (req, res) => {
    const posts = stores_1.postsStore.read();
    const linked = posts.filter((p) => p.linkedItems?.some((item) => item.itemId === req.params.id));
    const users = stores_1.usersStore.read();
    res.json({ posts: linked.map((p) => (0, enrich_1.enrichPost)(p, { users })) });
});
//
// ✅ GET /api/posts/:id/propagation-status – Simulate cascade status
//
router.get('/:id/propagation-status', (req, res) => {
    // This is a placeholder – you can replace with actual propagation logic
    const affected = [req.params.id];
    res.json({ cascadeCompleted: true, affectedIds: affected });
});
//
// ✅ GET single post (placed last to avoid route conflicts)
//
router.get('/:id', authOptional_1.default, (req, res) => {
    const posts = stores_1.postsStore.read();
    const post = posts.find((p) => p.id === req.params.id);
    if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
    }
    if ((post.type === 'meta_system' || post.systemGenerated === true) &&
        req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Access denied' });
        return;
    }
    const users = stores_1.usersStore.read();
    res.json((0, enrich_1.enrichPost)(post, { users, currentUserId: req.user?.id || null }));
});
exports.default = router;
