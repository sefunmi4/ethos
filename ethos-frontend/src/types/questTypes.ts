import type { LinkedItem } from './postTypes';
import type { CollaberatorRoles } from './postTypes';
import type { Post } from './postTypes';



export interface Quest {
  id: string;
  authorId: string;
  title: string;
  description?: string;
  visibility: 'public' | 'private' | 'hidden' | 'system';
  approvalStatus: 'approved' | 'flagged' | 'banned';
  flagCount?: number;
  status: 'active' | 'completed' | 'archived';
  headPostId: string;
  createdAt?: string;

  linkedPosts: LinkedItem[];
  collaborators: CollaberatorRoles[];
  gitRepo: {
    repoId: string;
    repoUrl: string;
    headCommitId?: string;
    defaultBranch?: string;
  };

  tags?: string[];
  defaultBoardId?: string;
  taskGraph?: TaskEdge[];

  /** Marks this quest as a request for help */
  helpRequest?: boolean;
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
