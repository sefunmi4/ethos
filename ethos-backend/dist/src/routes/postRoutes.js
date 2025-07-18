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
    const { type = 'free_speech', title = '', content = '', details = '', visibility = 'public', tags = [], questId = null, replyTo = null, linkedItems = [], linkedNodeId, collaborators = [], status, boardId, taskType = 'abstract', helpRequest = false, needsHelp = undefined, rating, } = req.body;
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
        linkedNodeId,
        questId,
        ...(type === 'task' ? { taskType } : {}),
        ...(type === 'review' && rating ? { rating: Math.min(5, Math.max(0, Number(rating))) } : {}),
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
    if (replyTo) {
        const parent = posts.find(p => p.id === replyTo);
        if (parent) {
            const users = stores_1.usersStore.read();
            const author = users.find(u => u.id === req.user.id);
            const followers = new Set([parent.authorId, ...(parent.followers || [])]);
            followers.forEach(uid => {
                if (uid === author?.id)
                    return;
                const notes = stores_1.notificationsStore.read();
                const newNote = {
                    id: (0, uuid_1.v4)(),
                    userId: uid,
                    message: `${author?.username || 'Someone'} replied to a post you follow`,
                    link: `/posts/${parent.id}`,
                    read: false,
                    createdAt: new Date().toISOString(),
                };
                stores_1.notificationsStore.write([...notes, newNote]);
            });
        }
    }
    if (questId && type === 'task') {
        const quest = quests.find((q) => q.id === questId);
        if (quest) {
            quest.taskGraph = quest.taskGraph || [];
            const parentId = replyTo || linkedNodeId || quest.headPostId || '';
            const exists = quest.taskGraph.some((e) => e.from === parentId && e.to === newPost.id);
            if (!exists) {
                quest.taskGraph.push({ from: parentId, to: newPost.id });
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
    if (post.type === 'review' && typeof post.rating === 'number') {
        post.rating = Math.min(5, Math.max(0, post.rating));
    }
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
// POST /api/posts/:id/follow - follow a post
router.post('/:id/follow', authMiddleware_1.authMiddleware, (req, res) => {
    const posts = stores_1.postsStore.read();
    const users = stores_1.usersStore.read();
    const post = posts.find(p => p.id === req.params.id);
    const follower = users.find(u => u.id === req.user.id);
    if (!post || !follower) {
        res.status(404).json({ error: 'Post not found' });
        return;
    }
    post.followers = Array.from(new Set([...(post.followers || []), follower.id]));
    stores_1.postsStore.write(posts);
    const notes = stores_1.notificationsStore.read();
    const newNote = {
        id: (0, uuid_1.v4)(),
        userId: post.authorId,
        message: `${follower.username} followed your post`,
        link: `/posts/${post.id}`,
        read: false,
        createdAt: new Date().toISOString(),
    };
    stores_1.notificationsStore.write([...notes, newNote]);
    res.json({ followers: post.followers });
});
// POST /api/posts/:id/unfollow - unfollow a post
router.post('/:id/unfollow', authMiddleware_1.authMiddleware, (req, res) => {
    const posts = stores_1.postsStore.read();
    const post = posts.find(p => p.id === req.params.id);
    if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
    }
    post.followers = (post.followers || []).filter(id => id !== req.user.id);
    stores_1.postsStore.write(posts);
    res.json({ followers: post.followers });
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
        subtype: 'task',
        nodeId: task.nodeId,
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
    task.helpRequest = true;
    task.needsHelp = true;
    const quests = stores_1.questsStore.read();
    const quest = task.questId ? quests.find(q => q.id === task.questId) : null;
    const openRoles = [
        ...(task.collaborators || []),
        ...(quest?.collaborators || [])
    ].filter(c => !c.userId);
    const subRequests = openRoles.map(role => ({
        id: (0, uuid_1.v4)(),
        authorId: req.user.id,
        type: 'request',
        content: `Role needed: ${(role.roles || []).join(', ')}`,
        visibility: task.visibility,
        timestamp: new Date().toISOString(),
        subtype: 'task',
        nodeId: task.nodeId,
        tags: [],
        collaborators: [role],
        replyTo: requestPost.id,
        repostedFrom: null,
        linkedItems: [
            { itemId: task.id, itemType: 'post', linkType: 'reference' },
        ],
        questId: task.questId || null,
        helpRequest: true,
        needsHelp: true,
    }));
    posts.push(requestPost, ...subRequests);
    stores_1.postsStore.write(posts);
    const users = stores_1.usersStore.read();
    res.status(201).json({
        request: (0, enrich_1.enrichPost)(requestPost, { users }),
        subRequests: subRequests.map(p => (0, enrich_1.enrichPost)(p, { users })),
    });
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
        subtype: ['task', 'issue'].includes(original.type) ? original.type : undefined,
        nodeId: ['task', 'issue'].includes(original.type) ? original.nodeId : undefined,
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
    original.helpRequest = true;
    original.needsHelp = true;
    posts.push(requestPost);
    stores_1.postsStore.write(posts);
    const users = stores_1.usersStore.read();
    res.status(201).json({
        request: (0, enrich_1.enrichPost)(requestPost, { users }),
        subRequests: [],
    });
});
//
// ❌ DELETE /api/posts/:id/request-help – Cancel help request and remove linked request posts
//
router.delete('/:id/request-help', authMiddleware_1.authMiddleware, (req, res) => {
    const posts = stores_1.postsStore.read();
    const post = posts.find(p => p.id === req.params.id);
    if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
    }
    const removedIds = [];
    for (let i = posts.length - 1; i >= 0; i--) {
        const p = posts[i];
        if (p.type === 'request' &&
            p.authorId === req.user.id &&
            p.helpRequest === true &&
            p.linkedItems?.some(li => li.itemId === post.id && li.itemType === 'post' && li.linkType === 'reference')) {
            removedIds.push(p.id);
            posts.splice(i, 1);
        }
    }
    post.helpRequest = false;
    post.needsHelp = false;
    stores_1.postsStore.write(posts);
    res.json({ success: true, removedIds });
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
    const follower = users.find(u => u.id === req.user.id);
    if (follower && post.authorId !== follower.id) {
        const notes = stores_1.notificationsStore.read();
        const newNote = {
            id: (0, uuid_1.v4)(),
            userId: post.authorId,
            message: `${follower.username} requested to join your post`,
            link: `/posts/${post.id}`,
            read: false,
            createdAt: new Date().toISOString(),
        };
        stores_1.notificationsStore.write([...notes, newNote]);
    }
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
    if (post.type === 'task' && post.questId) {
        const quests = stores_1.questsStore.read();
        const quest = quests.find(q => q.id === post.questId);
        if (quest) {
            const edges = quest.taskGraph || [];
            const parentEdge = edges.find(e => e.to === post.id);
            const parentId = parentEdge ? parentEdge.from : quest.headPostId;
            const childEdges = edges.filter(e => e.from === post.id);
            quest.taskGraph = edges.filter(e => e.from !== post.id);
            childEdges.forEach(e => {
                const exists = quest.taskGraph.some(se => se.from === parentId && se.to === e.to);
                if (!exists) {
                    quest.taskGraph.push({ ...e, from: parentId });
                }
            });
            stores_1.questsStore.write(quests);
        }
    }
    stores_1.postsStore.write(posts);
    res.json({ success: true });
});
//
// ✅ DELETE /api/posts/:id/archive – Remove archived tag
//
router.delete('/:id/archive', authMiddleware_1.authMiddleware, (req, res) => {
    const posts = stores_1.postsStore.read();
    const post = posts.find((p) => p.id === req.params.id);
    if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
    }
    post.tags = (post.tags || []).filter((t) => t !== 'archived');
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
    if (post.type === 'task' && post.questId) {
        const quest = quests.find(q => q.id === post.questId);
        if (quest) {
            const edges = quest.taskGraph || [];
            const parentEdge = edges.find(e => e.to === post.id);
            const parentId = parentEdge ? parentEdge.from : quest.headPostId;
            const childEdges = edges.filter(e => e.from === post.id);
            quest.taskGraph = edges.filter(e => e.to !== post.id && e.from !== post.id);
            childEdges.forEach(e => {
                const exists = quest.taskGraph.some(se => se.from === parentId && se.to === e.to);
                if (!exists) {
                    quest.taskGraph.push({ ...e, from: parentId });
                }
            });
            stores_1.questsStore.write(quests);
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
