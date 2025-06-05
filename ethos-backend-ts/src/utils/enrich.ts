import { Post, Quest, Board, User } from '../types/api';
import { EnrichedPost, EnrichedQuest, EnrichedUser, EnrichedBoard } from '../types/enriched';
import { usersStore, postsStore, questsStore } from '../models/stores';
import { formatPosts } from '../logic/postFormatter';

/**
 * Enrich a single post with author details and user-specific actions/hints.
 */
export const enrichPost = (
  post: Post,
  {
    users = usersStore.read(),
    currentUserId = null
  }: {
    users?: User[];
    currentUserId?: string | null;
  } = {}
): EnrichedPost | null => {
  const enriched = enrichPosts([post], users, currentUserId);
  return enriched[0] || null;
};

/**
 * Enrich an array of posts with author details and user-specific formatting.
 */
export const enrichPosts = (
  posts: Post[],
  users: User[] = usersStore.read(),
  currentUserId: string | null = null
): EnrichedPost[] => {
  const enriched = posts.map((post) => {
    const author = users.find((u) => u.id === post.authorId);
    const enrichedAuthor: EnrichedUser = author
      ? {
          ...author,
          profileUrl: `/profile/${author.id}`,
          rank: 'adventurer',
          level: 1,
          xp: {},
        }
      : {
          id: 'anon',
          username: 'Anonymous',
          createdAt: new Date().toISOString(),
          profileUrl: '#',
        };

    return {
      ...post,
      author: enrichedAuthor,
    };
  });

  return formatPosts(enriched, currentUserId);
};

/**
 * Enrich a board with full post/quest objects (does not mutate original board).
 */
export const enrichBoard = (
  board: Board,
  {
    posts = postsStore.read(),
    quests = questsStore.read(),
    users = usersStore.read(),
    currentUserId = null
  }: {
    posts?: Post[];
    quests?: Quest[];
    users?: User[];
    currentUserId?: string | null;
  } = {}
): EnrichedBoard => {
  const enrichedPosts = enrichPosts(posts, users, currentUserId);
  const enrichedQuests = enrichQuests(quests, { posts, users, currentUserId });

  const idMap = Object.fromEntries(
    (board.itemType === 'post' ? enrichedPosts : enrichedQuests).map((item) => [item.id, item])
  );

  return {
    ...board,
    items: (board as any).items?.map((id: string) => idMap[id]).filter(Boolean) || [],
  };
};

/**
 * Enrich a single quest with associated logs/tasks, and permission flags.
 */
export const enrichQuest = (
  quest: Quest,
  {
    posts = postsStore.read(),
    users = usersStore.read(),
    currentUserId = null
  }: {
    posts?: Post[];
    users?: User[];
    currentUserId?: string | null;
  } = {}
): EnrichedQuest => {
  const allEnrichedPosts = enrichPosts(posts, users, currentUserId);

  const logs = allEnrichedPosts.filter(p => p.questId === quest.id && p.type === 'quest_log');
  const tasks = allEnrichedPosts.filter(p => p.questId === quest.id && p.type === 'quest_task');

  const owner = users.find(u => u.id === quest.ownerId);
  const enrichedOwner: EnrichedUser | undefined = owner
    ? {
        ...owner,
        profileUrl: `/profile/${owner.id}`,
        rank: 'guild master',
        xp: {},
        level: 1,
      }
    : undefined;

  const collaborators: EnrichedUser[] =
    quest.collaborators?.map(id => {
      const match = users.find(u => u.id === id);
      return match
        ? {
            ...match,
            profileUrl: `/profile/${match.id}`,
            xp: {},
            level: 1,
          }
        : null;
    }).filter(Boolean) as EnrichedUser[] || [];

  return {
    ...quest,
    logs,
    tasks,
    owner: enrichedOwner,
    collaborators,
  };
};

/**
 * Enrich multiple quests with their logs/tasks.
 */
export const enrichQuests = (
  quests: Quest[],
  {
    posts = postsStore.read(),
    users = usersStore.read(),
    currentUserId = null
  }: {
    posts?: Post[];
    users?: User[];
    currentUserId?: string | null;
  } = {}
): EnrichedQuest[] => {
  return quests.map(q => enrichQuest(q, { posts, users, currentUserId }));
};