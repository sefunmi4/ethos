// Core types shared across Quest, Git, Post, User, and Board logic

// ---------------------------------------------------
// 🧠 Core: Git Repo & File Tracking Types
// ---------------------------------------------------

export interface GitRepo {
  id: string;
  repoUrl: string;
  defaultBranch: string;
  branches: string[];
  lastCommitSha: string;
  lastSync?: string;
  status: GitStatus;
  fileTree: GitFileNode[];
  commits: GitCommit[];
}

export interface GitFileNode {
  id: string;
  path: string;
  name: string;
  type: 'file' | 'dir';
  status: 'added' | 'modified' | 'deleted' | 'unchanged';
  children?: GitFileNode[];
  commitIds?: string[];
  linkedItem?: GitLinkedItem;
}

export interface GitCommit {
  id: string;
  sha: string;
  message: string;
  authorId: string;
  timestamp: string;
  fileChanges: GitFileChange[];
  parentShas?: string[];
  linkedItem?: GitLinkedItem;
  tags?: string[];
  metadata?: GitMetaData;
}

export interface GitFileChange {
  fileId: string;
  type: 'add' | 'modify' | 'delete';
  diff?: string;
}

export interface GitStatus {
  branch?: string;
  ahead?: number;
  behind?: number;
  isDirty?: boolean;
  uncommittedChanges?: GitFile[];
}

export interface GitLinkedItem {
  type: 'file' | 'dir' | 'commit';
  repoId: string;
  fileId?: string;
  commitId?: string;
  postId?: string;
  path?: string;
  line?: number;
  lineRange?: [number, number];
  linkType?: 'reference' | 'task' | 'comment';
  label?: string;
}

export interface GitMetaData {
  size?: number;
  linesChanged?: number;
  additions?: number;
  deletions?: number;
  ciPassed?: boolean;
  testCoverage?: number;
  changelogSummary?: string;
}

export interface DBGitRepo {
  id: string;
  repoUrl: string;
  defaultBranch: string;
  branches: string[];
  lastCommitSha: string;
  status: GitStatus;
  lastSync?: string;
  fileTree: GitFileNode[];
  commits: GitCommit[];
}

// ---------------------------------------------------
// 🔍 Quest Types (Graph + Git-aware)
// ---------------------------------------------------

export interface Quest {
  id: string;
  title: string;
  description?: string;
  authorId: string;
  status: 'active' | 'completed' | 'archived';
  headPostId: string;
  createdAt?: string;

  linkedPosts: LinkedItem[];
  collaborators: CollaboratorRole[];
  gitRepo: {
    repoId: string;
    headCommitId?: string;
    defaultBranch?: string;
  };

  tags?: string[];
  defaultBoardId?: string;
}

export interface DBQuest extends Quest {}

export interface TaskEdge {
  from: string;
  to: string;
  type?: 'sub_problem' | 'solution_branch' | 'folder_split';
  label?: string;
}

export interface CollaboratorRole {
  userId: string;
  roles?: string[];
}

// ---------------------------------------------------
// 📝 Post Types (content + commit-aware)
// ---------------------------------------------------

export interface Post {
  id: string;
  authorId: string;
  type: 'free_speech' | 'request' | 'task' | 'todo' | 'commit' | 'log';
  content: string;
  visibility: 'public' | 'private';
  timestamp: string;

  questId?: string;
  nodeId?: string;
  linkedGitItem?: GitLinkedItem;
  gitDiff?: string;
  commitSummary?: string;
  status?: 'todo' | 'in_progress' | 'complete';
  tags?: string[];
  collaborators: CollaboratorRole[];
  linkedItems: LinkedItem[];
  replyTo?: string;
  repostedFrom?: string;
  systemGenerated?: boolean;
}

export interface DBPost extends Post {}

export interface LinkedItem {
  itemId: string;
  itemType: 'post' | 'quest' | 'board' | 'file' | 'project';
  nodeId?: string;
  linkType?: 'reference' | 'solution' | 'comment';
  linkStatus?: 'active' | 'solved' | 'pending';
}

// ---------------------------------------------------
// 🧑‍🚀 User Types
// ---------------------------------------------------

export interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  tags: string[];
  links?: Record<string, string>;
  createdAt?: string;

  gitAccounts?: GitAccount[];
  experienceTimeline: UserExperienceEvent[];
}

export interface DBUser extends User {}

export interface GitAccount {
  provider: 'github' | 'gitlab';
  username: string;
  tokenHash?: string;
  linkedRepoIds?: string[];
}

export interface UserExperienceEvent {
  datetime: string;
  title: string;
  tags?: string[];
}

// ---------------------------------------------------
// 🧩 Enriched Types
// ---------------------------------------------------

export interface EnrichedQuest extends Quest {
  headPost?: Post;
  linkedPostsResolved?: Post[];
  logs?: Post[];
  tasks?: Post[];
  discussion?: Post[];

  taskGraph?: TaskEdge[];
  gitRepoInfo?: GitRepo;
  gitCommitMap?: Record<string, GitCommit>;
  gitFileMap?: Record<string, GitFileNode>;

  percentComplete?: number;
  taskCount?: number;
  completedTasks?: number;
  blockedTasks?: number;

  isFeatured?: boolean;
  isNew?: boolean;
}

export interface EnrichedPost extends Post {
  enrichedCollaborators?: User[];
  renderedContent?: string;
  quotedPost?: Post;
  originalEnrichedPost?: EnrichedPost;
  mediaPreviews?: MediaPreview[];
}

export interface MediaPreview {
  url: string;
  type: 'image' | 'video' | 'embed' | 'file';
  title?: string;
  thumbnail?: string;
}

export type BoardLayout = 'grid' | 'graph' | 'thread';

export interface Board {
  id: string;
  title: string;
  description?: string;
  layout: BoardLayout;
  items: (string | null)[];
  filters?: Record<string, any>;
  featured?: boolean;
  defaultFor?: 'home' | 'profile' | 'quests';
  createdAt: string;
  category?: string;
  userId: string;
}

export interface BoardData extends Board {
  enrichedItems?: (Post | Quest | Board)[];
  questId?: string;
}

export interface DBBoard extends Board {}

export interface RenderableItem {
  id: string;
  type: ItemType;
  title?: string;
  content?: string;
  status?: string;
  authorId?: string;
  visibility?: Visibility;
  tags?: string[];
  enriched?: boolean;
}

export type BoardItem = RenderableItem | Post | Quest | Board;

export interface BoardProps {
  boardId?: string;
  board?: BoardData;
  layout?: BoardLayout;
  title?: string;
  user?: User;
  editable?: boolean;
  readOnly?: boolean;
  compact?: boolean;
  showCreate?: boolean;
  filter?: Record<string, any>;
  onScrollEnd?: () => void;
  loading?: boolean;
  quest?: Quest;
}

export interface EditBoardProps {
  board: BoardData;
  onSave?: (updatedBoard: BoardData) => void;
  onCancel?: () => void;
  onDelete?: (boardId: string) => void;
}

export type GitItemType = 'post' | 'quest';
