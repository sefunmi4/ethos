// src/types/db.ts

export type UUID = string;
export type Timestamp = string;

export type Visibility = 'public' | 'private' | 'unlisted';
export type PostType = 'free_speech' | 'request' | 'quest_log' | 'commit' | 'issue';
export type ReactionType = 'like' | 'dislike' | 'laugh' | 'fire';

// 🔹 DB User (Minimal)
export interface DBUser {
  id: UUID;
  username: string;
  email?: string;
  createdAt: Timestamp;
}

// 🔹 DB Post (No enriched fields, just links)
export interface DBPost {
  id: UUID;
  authorId: UUID;
  type: PostType;
  content: string;
  visibility: Visibility;
  questId?: UUID;
  tags?: string[];
  collaborators?: UUID[];
  timestamp: Timestamp;
}

// 🔹 DB Quest (Flat, Git URL optional)
export interface DBQuest {
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

// 🔹 DB Board (Flat, layout + type only)
export interface DBBoard {
  id: UUID;
  title: string;
  description?: string;
  layout: 'list' | 'grid' | 'thread' | 'graph';
  itemType: 'post' | 'quest';
  filterTags?: string[];
  createdBy: UUID;
  createdAt: Timestamp;
}

// 🔹 DB Reaction
export interface DBReaction {
  id: UUID;
  postId: UUID;
  userId: UUID;
  type: ReactionType;
  timestamp: Timestamp;
}