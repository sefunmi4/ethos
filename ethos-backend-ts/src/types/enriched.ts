// src/types/enriched.ts

import { Post, Quest, Board, User } from './api';

/**
 * 💬 Enriched Post
 * Used in PostCard, PostTimeline, QuestLogs, etc.
 */
export interface EnrichedPost extends Post {
  author?: EnrichedUser;              // Resolved user object
  quest?: Partial<EnrichedQuest>;     // Basic quest data if linked
  replies?: EnrichedPost[];           // Nested replies (threaded view)
  reactions?: ReactionSummary;        // Reaction count summary
  editable?: boolean;                 // For current user
  isLinked?: boolean;                 // If it belongs to a quest/task
}

type BaseQuest = Omit<Quest, 'collaborators'>;

/**
 * 📦 Enriched Quest
 */
export interface EnrichedQuest extends BaseQuest {
  logs?: EnrichedPost[];
  tasks?: QuestTaskPost[];
  owner?: EnrichedUser;
  collaborators?: EnrichedUser[];
  repoMeta?: GitRepoMeta;

  isEditable?: boolean;           // ✅ NEW
  isCollaborator?: boolean;       // ✅ NEW
  topLevelTasks?: QuestTaskPost[];// ✅ NEW
}

export interface QuestTaskPost extends EnrichedPost {
  status?: string;
  priority?: number;
  parentId?: string | null;
}

/**
 * 🧠 Enriched Board
 * Combines layout + resolved posts/quests
 */
export interface EnrichedBoard extends Board {
  items: EnrichedPost[] | EnrichedQuest[];
  itemType: 'post' | 'quest';
  selectedItemId?: string;
  layoutMeta?: {
    // Optional layout state or UI metadata
    compact?: boolean;
    filterTag?: string;
  };
}

/**
 * 🧑 Enriched User
 * Used in PostHeader, ProfileBanner, etc.
 */
export interface EnrichedUser extends User {
  rank?: string;                      // Optional rank or skill title
  skillTags?: string[];              // User tags like "developer", "artist"
  xp?: Record<string, number>;       // XP per skill
  level?: number;                    // Derived overall level
  profileUrl?: string;               // Route to their profile
}

/**
 * 📊 Reaction Summary
 * Render emoji totals for post reaction buttons
 */
export interface ReactionSummary {
  like: number;
  dislike: number;
  laugh?: number;
  fire?: number;
  [emoji: string]: number | undefined;
}

/**
 * 🔁 Git Repo Metadata (if quest has linked GitHub repo)
 */
export interface GitRepoMeta {
  commits?: number;
  contributors?: string[];
  latestCommitDate?: string;
  repoName?: string;
  repoUrl?: string;
}