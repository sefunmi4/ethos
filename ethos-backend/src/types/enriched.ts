import type { Post, Quest, Board, User, GitRepoMeta, AppItem, GitCommit, GitFile, GitStatus } from './api';


export interface EnrichedPost extends Post {
  enrichedCollaborators?:  EnrichedCollaborator[];

  questTitle?: string;

  renderedContent?: string; // Markdown, etc.

  mediaPreviews?: Array<{
    url: string;
    type: 'image' | 'video' | 'embed' | 'file';
    title?: string;
    thumbnail?: string;
  }>;

  quotedPost?: Post; // For reply or embed
  originalEnrichedPost?: EnrichedPost; // For reposts
}

export interface EnrichedQuest extends Omit<Quest, 'collaborators'> {
  headPost?: Post; // Head/intro post
  linkedPostsResolved?: Post[]; // All posts linked

  // Subsets for UI filtering
  logs?: Post[];
  tasks?: Post[];
  discussion?: Post[];
  collaborators: EnrichedCollaborator[];

  // Graph layout between posts/tasks
  taskGraph?: TaskEdge[];

  // Task progress summary
  percentComplete?: number;
  taskCount?: number;
  completedTasks?: number;
  blockedTasks?: number;

  // UI-specific flags
  isFeatured?: boolean;
  isNew?: boolean;

  /** Permissions computed for the current user */
  isEditable?: boolean;
  isCollaborator?: boolean;

  /** Convenience subset for rendering */
  topLevelTasks?: Post[];
}

// 🔍 TaskEdge type to define sub-problem relationships in the graph
export interface TaskEdge {
  from: string; // Node ID
  to: string;   // Node ID
  type?: 'sub_problem' | 'solution_branch' | 'folder_split'; // Describes edge purpose
  label?: string;
}


export interface EnrichedBoard extends Board {
  resolvedItems: AppItem[];
  enrichedItems: (EnrichedPost | EnrichedQuest)[];

  /** Optional computed groups */
  posts?: EnrichedPost[];   // Filtered for posts
  quests?: EnrichedQuest[];  // Filtered for quests
  tasks?: AppItem[];   // Filtered for 'task' type posts

  /** Optional board-level stats */
  postCount?: number;
  questCount?: number;
  taskCount?: number;
}

export interface EnrichedGitCommit extends GitCommit {
  linkedPost?: Post;
  linkedQuest?: Quest;

  // Optional enhancements
  isRelease?: boolean;
  isRevert?: boolean;
  enrichedDiffHtml?: string;
}

export interface EnrichedGitRepo extends GitRepoMeta {
  commits: EnrichedGitCommit[];
  files: GitFile[];
  branches: GitBranch[];
  status: GitStatus;
}

// Branch metadata from Git
export interface GitBranch {
  name: string;
  isDefault: boolean;
  lastCommitSha: string;
}

export interface EnrichedUser extends Omit<User, 'password'> {
  recentPosts?: Post[];
  activeQuests?: Quest[];

  postCount?: number;
  questCount?: number;

  isOnline?: boolean;
  isNew?: boolean;
  isStaff?: boolean;

  // Used for displaying roles as badges
  displayRole?: string;
}

export interface EnrichedCollaborator {
  /** Undefined when representing an open role */
  userId?: string;
  username?: string;
  roles?: string[];
  avatarUrl?: string;
  bio?: string;
  /** Flag indicating this collaborator slot has no assigned user */
  isOpenRole?: boolean;
}