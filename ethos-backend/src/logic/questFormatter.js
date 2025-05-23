// questFormatter.js

import { canEditQuest, isCollaborator } from './permissionUtils.js';

/**
 * Add structure and permission info to a single quest object.
 * Accepts optional posts to derive logs and tasks
 */
export const formatQuest = (quest, currentUserId, posts = []) => {
  if (!quest) return null;

  const logs = posts.filter(p => p.type === 'quest_log' && p.questId === quest.id);
  const tasks = posts.filter(p => p.type === 'quest_task' && p.questId === quest.id);

  const structuredTasks = tasks.map(t => ({
    ...t,
    status: t.status || 'todo',
    priority: t.priority || 0,
    parentId: t.parentId || null,
  }));

  return {
    ...quest,
    logs,
    tasks: structuredTasks,
    isEditable: canEditQuest(quest, currentUserId),
    isCollaborator: isCollaborator(quest, currentUserId),
    topLevelTasks: structuredTasks.filter(t => !t.parentId)
  };
};

/**
 * Format multiple quests with optional post context
 */
export const formatQuests = (quests = [], currentUserId, posts = []) => {
  return quests.map(q => formatQuest(q, currentUserId, posts));
};
