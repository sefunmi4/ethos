import { Post, Quest, User } from '../types/api';
import {
  EnrichedQuest,
  EnrichedPost,
  EnrichedUser,
  EnrichedCollaborator,
} from '../types/enriched';
import { canEditQuest, isCollaborator } from './permissionUtils';

/**
 * Add layout and permission info to a single quest object.
 * Accepts optional posts to derive logs and tasks.
 */
export const formatQuest = (
  quest: Quest,
  currentUserId: string,
  posts: Post[] = [],
  allUsers: User[] = []
): EnrichedQuest => {
  const logs: EnrichedPost[] = posts
    .filter(
      (p) =>
        p.type === 'free_speech' && p.questId === quest.id && p.replyTo
    ) as EnrichedPost[];
  const tasks: EnrichedPost[] = posts
    .filter((p): p is EnrichedPost => p.type === 'task' && p.questId === quest.id)
    .map((task) => ({
      ...task,
      status: task.status || 'todo',
    }));

  const enrichedCollaborators: EnrichedCollaborator[] = (quest.collaborators || [])
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
    isEditable: canEditQuest(quest, currentUserId),

    isCollaborator: isCollaborator(quest, currentUserId),
    topLevelTasks: tasks.filter(t => !(t as any).parentId),
  };
};

/**
 * Format multiple quests with optional post context.
 */
export const formatQuests = (
  quests: Quest[] = [],
  currentUserId: string,
  posts: Post[] = []
): EnrichedQuest[] => {
  return quests.map(q => formatQuest(q, currentUserId, posts));
};