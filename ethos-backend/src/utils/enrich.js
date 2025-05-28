// src/utils/enrich.js
import { formatPosts } from '../logic/postFormatter.js';
import { usersStore, postsStore, questsStore } from './loaders.js';

/**
 * Enrich a single post with author details and user-specific actions/hints.
 */
export const enrichPost = (post, {
  users = usersStore.read(),
  currentUserId = null
} = {}) => {
  const enriched = enrichPosts([post], users, currentUserId);
  return enriched[0] || null;
};

/**
 * Enrich an array of posts with author details and user-specific formatting.
 */
export const enrichPosts = (
  posts,
  users = usersStore.read(),
  currentUserId = null
) => {
  const enriched = posts.map(post => {
    const author = users.find(u => u.id === post.authorId);
    return {
      ...post,
      author: author
        ? { id: author.id, username: author.username || `user_${author.id.slice(-5)}` }
        : { id: 'anon', username: 'Anonymous' }
    };
  });

  return formatPosts(enriched, currentUserId);
};

/**
 * Enrich a board with full post objects (does not mutate original board).
 */
export const enrichBoard = (
  board,
  {
    posts = postsStore.read(),
    users = usersStore.read(),
    currentUserId = null
  } = {}
) => {
  const enriched = enrichPosts(posts, users, currentUserId);
  const idMap = Object.fromEntries(enriched.map(p => [p.id, p]));

  return {
    ...board,
    enrichedItems: (board.items || []).map(id => idMap[id]).filter(Boolean)
  };
};

/**
 * Enrich a single quest with associated logs/tasks, and permission flags.
 */
export const enrichQuest = (
  quest,
  {
    posts = postsStore.read(),
    users = usersStore.read(),
    currentUserId = null
  } = {}
) => {
  const allEnriched = enrichPosts(posts, users, currentUserId);

  const logs = allEnriched.filter(p => p.questId === quest.id && p.type === 'quest_log');
  const tasks = allEnriched.filter(p => p.questId === quest.id && p.type === 'quest_task');

  return {
    ...quest,
    logs,
    tasks,
    topLevelTasks: tasks.filter(t => !t.parentId),
    collaborators: quest.collaborators || []
  };
};

/**
 * Enrich multiple quests with their logs/tasks.
 */
export const enrichQuests = (
  quests,
  {
    posts = postsStore.read(),
    users = usersStore.read(),
    currentUserId = null
  } = {}
) => {
  return quests.map(q => enrichQuest(q, { posts, users, currentUserId }));
};