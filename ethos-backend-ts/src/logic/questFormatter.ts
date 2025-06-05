import { Post, Quest, User } from '../types/api';
import { EnrichedQuest, EnrichedPost, QuestTaskPost, EnrichedUser } from '../types/enriched';
import { canEditQuest, isCollaborator } from './permissionUtils';

/**
 * Add structure and permission info to a single quest object.
 * Accepts optional posts to derive logs and tasks.
 */
export const formatQuest = (
  quest: Quest,
  currentUserId: string,
  posts: Post[] = [],
  allUsers: User[] = []
): EnrichedQuest => {
  const logs: EnrichedPost[] = posts
    .filter(p => p.type === 'quest_log' && p.questId === quest.id) as EnrichedPost[];

  const tasks: QuestTaskPost[] = posts
    .filter(p => p.type === 'quest_task' && p.questId === quest.id)
    .map((task) => {
      const enriched = task as QuestTaskPost;
      return {
        ...enriched,
        status: enriched.status || 'todo',
        priority: enriched.priority ?? 0,
        parentId: enriched.parentId || null,
      };
    });

  const enrichedCollaborators: EnrichedUser[] = (quest.collaborators || [])
    .map(id => allUsers.find(u => u.id === id))
    .filter((u): u is EnrichedUser => !!u); // 👈 type guard to exclude undefined

  return {
    ...quest,
    collaborators: enrichedCollaborators, // ✅ now EnrichedUser[]
    logs,
    tasks,
    isEditable: canEditQuest(quest, currentUserId),
    isCollaborator: isCollaborator(quest, currentUserId),
    topLevelTasks: tasks.filter(t => !t.parentId),
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