import type { DBPost, DBQuest, DBBoard, DBUser } from '../types/db';
import type { User, Post, Quest, RepostMeta } from '../types/api';
import type {
  EnrichedPost,
  EnrichedQuest,
  EnrichedUser,
  EnrichedBoard,
  EnrichedCollaborator,
} from '../types/enriched';

import { usersStore, postsStore, questsStore } from '../models/stores';
import { formatPosts } from '../logic/postFormatter';


/**
 * Normalize DBPost into valid Post layout.
 */
const normalizePost = (post: DBPost): Post => {
  const repostMeta: RepostMeta | null =
    typeof post.repostedFrom === 'string'
      ? ({ originalPostId: post.repostedFrom } as RepostMeta)
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
const normalizeQuest = (quest: DBQuest): Quest => {
  return {
    ...quest,
    gitRepo: quest.gitRepo
      ? { repoUrl: quest.gitRepo.repoUrl ?? '', ...quest.gitRepo }
      : undefined,
  } as Quest;
};

/**
 * Enrich a single user with computed metadata.
 */
export const enrichUser = (
  user: User | DBUser,
  {
    currentUserId = null,
    posts = [],
    quests = [],
  }: {
    currentUserId?: string | null;
    posts?: DBPost[];
    quests?: DBQuest[];
  } = {}
): EnrichedUser => {
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

  const safeUser = user as Omit<User, 'password'>;

  return {
    ...safeUser,
    links: safeLinks as User['links'],

    recentPosts: userPosts.slice(0, 5),
    activeQuests: userQuests.filter((q) => q.status === 'active'),

    postCount: userPosts.length,
    questCount: userQuests.length,

    isStaff: ['admin', 'moderator'].includes(user.role),
    isNew:
      !user.createdAt ||
      Date.now() - new Date(user.createdAt).getTime() < 1000 * 60 * 60 * 24 * 7,
    isOnline: false,

    displayRole:
      user.role === 'admin'
        ? 'Admin'
        : user.role === 'moderator'
        ? 'Moderator'
        : 'Adventurer',
  };
};

/**
 * Enrich a single post with author info.
 */
export const enrichPost = (
  post: DBPost,
  {
    users = usersStore.read(),
    quests = questsStore.read(),
    currentUserId = null,
  }: {
    users?: DBUser[];
    quests?: DBQuest[];
    currentUserId?: string | null;
  } = {}
): EnrichedPost | null => {
  return enrichPosts([post], users, quests, currentUserId)[0] || null;
};

/**
 * Enrich multiple posts with author info and formatting.
 */
export const enrichPosts = (
  posts: DBPost[],
  users: DBUser[] = usersStore.read(),
  quests: DBQuest[] = questsStore.read(),
  currentUserId: string | null = null
): EnrichedPost[] => {
  const enriched = posts.map((post) => {
    const normalized = normalizePost(post);
    const author = users.find((u) => u.id === post.authorId);
    const enrichedAuthor = author
      ? enrichUser(author, { currentUserId })
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

  return formatPosts(enriched, currentUserId);
};

/**
 * Enrich a quest with logs, tasks, and user references.
 */
export const enrichQuest = (
  quest: DBQuest,
  {
    posts = postsStore.read(),
    users = usersStore.read(),
    currentUserId = null,
  }: {
    posts?: DBPost[];
    users?: DBUser[];
    currentUserId?: string | null;
  } = {}
): EnrichedQuest => {
  const allPosts = enrichPosts(posts, users, questsStore.read(), currentUserId);
  const normalizedQuest = normalizeQuest(quest);
  const logs = allPosts.filter(
    (p) => p.questId === quest.id && p.type === 'free_speech' && p.replyTo
  );
  const tasks = allPosts.filter(
    (p) => p.questId === quest.id && p.type === 'task'
  );
  const discussion = allPosts.filter(
    (p) => p.questId === quest.id && p.type === 'free_speech' && !p.replyTo
  );

  const linkedPostsResolved = allPosts.filter((p) =>
    quest.linkedPosts?.some((l) => l.itemId === p.id)
  );

  const enrichedCollaborators: EnrichedCollaborator[] = quest.collaborators.map((c) => {
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
  const authorUser = users.find((u) => u.id === quest.authorId);
  return {
    ...normalizedQuest,
    author: authorUser ? { id: authorUser.id, username: authorUser.username } : { id: quest.authorId },
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

/**
 * Enrich multiple quests.
 */
export const enrichQuests = (
  quests: DBQuest[],
  {
    posts = postsStore.read(),
    users = usersStore.read(),
    currentUserId = null,
  }: {
    posts?: DBPost[];
    users?: DBUser[];
    currentUserId?: string | null;
  } = {}
): EnrichedQuest[] => quests.map((q) => enrichQuest(q, { posts, users, currentUserId }));

/**
 * Enrich a board by resolving its items to posts or quests.
 */
export const enrichBoard = (
  board: DBBoard,
  {
    posts = postsStore.read(),
    quests = questsStore.read(),
    users = usersStore.read(),
    currentUserId = null,
  }: {
    posts?: DBPost[];
    quests?: DBQuest[];
    users?: DBUser[];
    currentUserId?: string | null;
  }
): EnrichedBoard => {
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
    .filter((i): i is Post | Quest => i !== null)
    .filter((item) => {
      if ('type' in item) {
        const p = item as DBPost;
        return p.type !== 'request' ||
          p.visibility === 'public' ||
          p.visibility === 'request_board' ||
          p.needsHelp === true;
      }
      const q = item as DBQuest;
      if (q.displayOnBoard === false) return false;
      if (q.status === 'active' && currentUserId) {
        const participant =
          q.authorId === currentUserId ||
          (q.collaborators || []).some((c) => c.userId === currentUserId);
        if (!participant) return false;
      }
      return true;
    });

  const enrichedItems = board.items
    .map((id) => {
      const post = posts.find((p) => p.id === id);
      if (post) {
        return enrichPost(post, { users, currentUserId });
      }

      const quest = quests.find((q) => q.id === id);
      if (quest) {
        return enrichQuest(quest, { posts, users, currentUserId });
      }

      return null;
    })
    .filter((i): i is EnrichedPost | EnrichedQuest => i !== null)
    .filter((item) => {
      if ('type' in item) {
        const p = item as EnrichedPost;
        return p.type !== 'request' ||
          p.visibility === 'public' ||
          p.visibility === 'request_board' ||
          p.needsHelp === true;
      }
      const q = item as EnrichedQuest;
      if (q.displayOnBoard === false) return false;
      if (q.status === 'active' && currentUserId) {
        const participant =
          q.authorId === currentUserId ||
          (q.collaborators || []).some((c) => c.userId === currentUserId);
        if (!participant) return false;
      }
      return true;
    });

  return {
    ...board,
    resolvedItems,
    enrichedItems,
  };
};