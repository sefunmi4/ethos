import type { LinkedItem } from './itemTypes';
import type { CollaberatorRoles } from './postTypes';
import type { Post } from './postTypes';

export interface Quest {
  id: string;
  authorId: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  headPostId: string;
  linkedPosts: LinkedItem[];
  collaborators: CollaberatorRoles[]; // ✅ Change this line
  repoUrl?: string;
  createdAt?: string;
  ownerId?: string;
  // 🆕 Optional additions
  tags?: string[];
}


// 🔍 TaskEdge type to define sub-problem relationships in the graph
export interface TaskEdge {
  from: string; // Node ID
  to: string;   // Node ID
  type?: 'sub_problem' | 'solution_branch' | 'folder_split'; // Describes edge purpose
  label?: string;
}


/**
 * A more detailed version of a Quest with computed data.
 * Used for rendering UIs or dashboards.
 */
export interface EnrichedQuest extends Quest {
  /** Resolved post objects (instead of just headPostId) */
  headPost?: Post;

  /** All posts linked to this quest */
  linkedPostsResolved?: Post[];

  /** Posts filtered as logs, tasks, etc. */
  logs?: Post[];
  tasks?: Post[];
  discussion?: Post[];

  /** Graph edges between tasks/logs */
  taskGraph?: TaskEdge[];

  /** Computed metadata */
  percentComplete?: number; // Based on task status
  taskCount?: number;
  completedTasks?: number;
  blockedTasks?: number;

  /** UI-specific */
  isFeatured?: boolean;
  isNew?: boolean;
}
