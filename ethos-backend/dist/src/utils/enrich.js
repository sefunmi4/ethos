"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichBoard = exports.enrichQuests = exports.enrichQuest = exports.enrichPosts = exports.enrichPost = exports.enrichUser = void 0;
const stores_1 = require("../models/stores");
const postFormatter_1 = require("../logic/postFormatter");
/**
 * Normalize DBPost into valid Post layout.
 */
const normalizePost = (post) => {
    const repostMeta = typeof post.repostedFrom === 'string'
        ? { originalPostId: post.repostedFrom }
        : post.repostedFrom ?? null;
    return {
        ...post,
        tags: post.tags ?? [],
        collaborators: post.collaborators ?? [],
        linkedItems: post.linkedItems ?? [],
        repostedFrom: repostMeta,
    };
};
/**
 * Normalize DBQuest into valid Quest layout.
 */
const normalizeQuest = (quest) => {
    return {
        ...quest,
        gitRepo: quest.gitRepo
            ? { repoUrl: quest.gitRepo.repoUrl ?? '', ...quest.gitRepo }
            : undefined,
    };
};
/**
 * Enrich a single user with computed metadata.
 */
const enrichUser = (user, { currentUserId = null, posts = [], quests = [], } = {}) => {
    const safeLinks = user.links ?? {
        github: '',
        linkedin: '',
        twitter: '',
        tiktok: '',
        youtube: '',
        website: '',
        blog: '',
        other: '',
    };
    const normalizedPosts = posts.map(normalizePost);
    const userPosts = normalizedPosts.filter((p) => p.authorId === user.id);
    const normalizedQuests = quests.map(normalizeQuest);
    const userQuests = normalizedQuests.filter((q) => q.authorId === user.id);
    const safeUser = user;
    return {
        ...safeUser,
        links: safeLinks,
        recentPosts: userPosts.slice(0, 5),
        activeQuests: userQuests.filter((q) => q.status === 'active'),
        postCount: userPosts.length,
        questCount: userQuests.length,
        isStaff: ['admin', 'moderator'].includes(user.role),
        isNew: !user.createdAt ||
            Date.now() - new Date(user.createdAt).getTime() < 1000 * 60 * 60 * 24 * 7,
        isOnline: false,
        displayRole: user.role === 'admin'
            ? 'Admin'
            : user.role === 'moderator'
                ? 'Moderator'
                : 'Adventurer',
    };
};
exports.enrichUser = enrichUser;
/**
 * Enrich a single post with author info.
 */
const enrichPost = (post, { users = stores_1.usersStore.read(), quests = stores_1.questsStore.read(), currentUserId = null, } = {}) => {
    return (0, exports.enrichPosts)([post], users, quests, currentUserId)[0] || null;
};
exports.enrichPost = enrichPost;
/**
 * Enrich multiple posts with author info and formatting.
 */
const enrichPosts = (posts, users = stores_1.usersStore.read(), quests = stores_1.questsStore.read(), currentUserId = null) => {
    const enriched = posts.map((post) => {
        const normalized = normalizePost(post);
        const author = users.find((u) => u.id === post.authorId);
        const enrichedAuthor = author
            ? (0, exports.enrichUser)(author, { currentUserId })
            : {
                id: 'anon',
                username: 'Anonymous',
                bio: '',
                tags: [],
                links: {},
                experienceTimeline: [],
                email: '',
                role: 'user',
                profileUrl: '#',
                rank: 'guest',
                level: 0,
                xp: {},
            };
        return {
            ...normalized,
            author: {
                id: enrichedAuthor.id,
                username: enrichedAuthor.username,
            },
            questTitle: normalized.questId
                ? quests.find((q) => q.id === normalized.questId)?.title
                : undefined,
            enriched: true,
        };
    });
    return (0, postFormatter_1.formatPosts)(enriched, currentUserId);
};
exports.enrichPosts = enrichPosts;
/**
 * Enrich a quest with logs, tasks, and user references.
 */
const enrichQuest = (quest, { posts = stores_1.postsStore.read(), users = stores_1.usersStore.read(), currentUserId = null, } = {}) => {
    const allPosts = (0, exports.enrichPosts)(posts, users, stores_1.questsStore.read(), currentUserId);
    const normalizedQuest = normalizeQuest(quest);
    const logs = allPosts.filter((p) => p.questId === quest.id && p.type === 'log');
    const tasks = allPosts.filter((p) => p.questId === quest.id && p.type === 'task');
    const discussion = allPosts.filter((p) => p.questId === quest.id && p.type === 'free_speech');
    const linkedPostsResolved = allPosts.filter((p) => quest.linkedPosts?.some((l) => l.itemId === p.id));
    const enrichedCollaborators = quest.collaborators.map((c) => {
        if (!c.userId) {
            return { roles: c.roles, isOpenRole: true };
        }
        const u = users.find((u) => u.id === c.userId);
        return u
            ? {
                userId: u.id,
                username: u.username,
                roles: c.roles,
                avatarUrl: u.avatarUrl,
                bio: u.bio,
            }
            : { userId: c.userId, roles: c.roles };
    });
    const headPostDB = posts.find((p) => p.id === quest.headPostId);
    return {
        ...normalizedQuest,
        headPost: headPostDB ? normalizePost(headPostDB) : undefined,
        logs,
        tasks,
        discussion,
        linkedPostsResolved,
        collaborators: enrichedCollaborators,
        taskGraph: quest.taskGraph ?? [],
        percentComplete: 0, // Optional: compute from task statuses
        taskCount: tasks.length,
        completedTasks: tasks.filter((t) => t.status === 'Done').length,
        blockedTasks: tasks.filter((t) => t.status === 'Blocked').length,
    };
};
exports.enrichQuest = enrichQuest;
/**
 * Enrich multiple quests.
 */
const enrichQuests = (quests, { posts = stores_1.postsStore.read(), users = stores_1.usersStore.read(), currentUserId = null, } = {}) => quests.map((q) => (0, exports.enrichQuest)(q, { posts, users, currentUserId }));
exports.enrichQuests = enrichQuests;
/**
 * Enrich a board by resolving its items to posts or quests.
 */
const enrichBoard = (board, { posts = stores_1.postsStore.read(), quests = stores_1.questsStore.read(), users = stores_1.usersStore.read(), currentUserId = null, }) => {
    const resolvedItems = board.items
        .map((id) => {
        const post = posts.find((p) => p.id === id);
        if (post) {
            return normalizePost(post);
        }
        const quest = quests.find((q) => q.id === id);
        if (quest) {
            return normalizeQuest(quest);
        }
        return null;
    })
        .filter((i) => i !== null)
        .filter((item) => {
        if ('type' in item) {
            const p = item;
            return p.type !== 'request' ||
                p.visibility === 'public' ||
                p.visibility === 'request_board' ||
                p.needsHelp === true;
        }
        const q = item;
        if (q.displayOnBoard === false)
            return false;
        if (q.status === 'active' && currentUserId) {
            const participant = q.authorId === currentUserId ||
                (q.collaborators || []).some((c) => c.userId === currentUserId);
            if (!participant)
                return false;
        }
        return true;
    });
    const enrichedItems = board.items
        .map((id) => {
        const post = posts.find((p) => p.id === id);
        if (post) {
            return (0, exports.enrichPost)(post, { users, currentUserId });
        }
        const quest = quests.find((q) => q.id === id);
        if (quest) {
            return (0, exports.enrichQuest)(quest, { posts, users, currentUserId });
        }
        return null;
    })
        .filter((i) => i !== null)
        .filter((item) => {
        if ('type' in item) {
            const p = item;
            return p.type !== 'request' ||
                p.visibility === 'public' ||
                p.visibility === 'request_board' ||
                p.needsHelp === true;
        }
        const q = item;
        if (q.displayOnBoard === false)
            return false;
        if (q.status === 'active' && currentUserId) {
            const participant = q.authorId === currentUserId ||
                (q.collaborators || []).some((c) => c.userId === currentUserId);
            if (!participant)
                return false;
        }
        return true;
    });
    return {
        ...board,
        resolvedItems,
        enrichedItems,
    };
};
exports.enrichBoard = enrichBoard;
