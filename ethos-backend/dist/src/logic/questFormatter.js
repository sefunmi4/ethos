"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatQuests = exports.formatQuest = void 0;
const permissionUtils_1 = require("./permissionUtils");
/**
 * Add layout and permission info to a single quest object.
 * Accepts optional posts to derive logs and tasks.
 */
const formatQuest = (quest, currentUserId, posts = [], allUsers = []) => {
    const logs = posts
        .filter(p => p.type === 'log' && p.questId === quest.id);
    const tasks = posts
        .filter((p) => p.type === 'task' && p.questId === quest.id)
        .map((task) => ({
        ...task,
        status: task.status || 'todo',
    }));
    const enrichedCollaborators = (quest.collaborators || [])
        .map(c => {
        if (!c.userId) {
            return { roles: c.roles, isOpenRole: true };
        }
        const user = allUsers.find(u => u.id === c.userId);
        return user
            ? {
                userId: user.id,
                username: user.username,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                roles: c.roles,
            }
            : { userId: c.userId, roles: c.roles };
    });
    return {
        ...quest,
        collaborators: enrichedCollaborators,
        logs,
        tasks,
        isEditable: (0, permissionUtils_1.canEditQuest)(quest, currentUserId),
        isCollaborator: (0, permissionUtils_1.isCollaborator)(quest, currentUserId),
        topLevelTasks: tasks.filter(t => !t.parentId),
    };
};
exports.formatQuest = formatQuest;
/**
 * Format multiple quests with optional post context.
 */
const formatQuests = (quests = [], currentUserId, posts = []) => {
    return quests.map(q => (0, exports.formatQuest)(q, currentUserId, posts));
};
exports.formatQuests = formatQuests;
