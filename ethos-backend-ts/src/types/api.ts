// src/types/api.ts

// 🔖 Base shared types
export type UUID = string;
export type Timestamp = string;

export type Visibility = 'public' | 'private' | 'unlisted';

export type PostType = 'free_speech' | 'request' | 'quest_log' | 'quest_task' | 'commit' | 'issue';
export type LinkType = 'quest' | 'post' | 'task' | 'log';

export type ReactionType = 'like' | 'dislike' | 'laugh' | 'fire';

// 🧑 User
export interface User {
  id: UUID;
  username: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  tags?: string[];
  social?: {
    github?: string;
    website?: string;
    twitter?: string;
  };
  createdAt: Timestamp;
}

// 📝 Post
export interface Post {
  id: UUID;
  authorId: UUID;
  type: PostType;
  content: string;
  visibility: Visibility;
  questId?: UUID | null;
  tags?: string[];
  collaborators?: UUID[];
  timestamp: Timestamp;
}

// 📦 Quest
export interface Quest {
  id: UUID;
  title: string;
  description?: string;
  ownerId: UUID;
  tags?: string[];
  collaborators?: UUID[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  githubRepoUrl?: string;
}

// 🧭 Board
export interface Board {
  id: UUID;
  title: string;
  description?: string;
  layout: 'list' | 'grid' | 'thread' | 'graph';
  itemType: 'post' | 'quest';
  filterTags?: string[];
  createdBy: UUID;
  createdAt: Timestamp;
}

// 💬 Reaction
export interface Reaction {
  id: UUID;
  postId: UUID;
  userId: UUID;
  type: ReactionType;
  timestamp: Timestamp;
}

// 🧵 Thread (optional type if you store them separately)
export interface Thread {
  id: UUID;
  rootPostId: UUID;
  postIds: UUID[];
}