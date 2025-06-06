// Shared type for linking Git data to quests or posts
export type GitItemType = 'post' | 'quest';

// Complete repository representation used across API responses
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

export interface GitLinkedItem {
  itemId: string;
  itemType: GitItemType;
  nodeId?: string;
  label?: string;
}


// File type used across commits, status, and diffs
export interface GitFile {
  path: string;              // Full path relative to repo root
  name: string;              // Extracted filename
  type: 'code' | 'markdown' | 'image' | 'binary' | 'json' | 'text' | string;

  preview?: string;          // Optional snippet for preview
  metadata?: GitMetaData;

  lastModifiedBy?: string;   // SHA or commit ID
  deleted?: boolean;         // Whether file was deleted in this commit
  linkedTo?: GitLinkedItem;  // Optional connection to a quest or post

  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'unchanged';
  oldPath?: string; // for renamed files
  additions?: number;
  deletions?: number;
  blobUrl?: string; // optional link to raw file
  filesChanged: GitFile[];
  parentHashes?: string[];
}

export interface DBGitRepo {
  repoUrl: string;
  defaultBranch: string;
  branches: string[];
  lastCommitSha: string;
  status: GitStatus;
  lastSync?: string;
  files?: DBGitFile;
}

export interface DBGitFile {
  path: string;
  name: string;
  type: string;
  status: string;
  linkedTo?: GitLinkedItem;
  commits?: DBGitCommit;
}

export interface DBGitCommit {
  id: string;
  message: string;
  authorId: string;
  timestamp: string;
  files: string[]; // array of file paths or file IDs
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

export interface GitMetaData {
  size?: number;           // Size in bytes
  linesChanged?: number;
  additions?: number;
  deletions?: number;
}

// Metadata about a commit in a Git repo
export interface GitCommit {
  id: string; // SHA
  message: string;

  author: {
    id: string;
    username?: string;
    avatarUrl?: string;
  };

  timestamp: string;          // ISO timestamp
  files?: GitFile[];          // Changed files in commit
  diff?: string;              // Unified diff format
  parentShas?: string[];      // Parent commits (for merges)

  linkedItem?: GitLinkedItem; // Optional link to post/quest
  tags?: string[];            // Optional tags (e.g. release, refactor)

  metadata?: GitMetaData;

}

// Branch metadata from Git
export interface GitBranch {
  name: string;
  isDefault: boolean;
  lastCommitSha: string;
}

// Git status relative to origin
export interface GitStatus {
  branch?: string;
  ahead?: number;
  behind?: number;
  isDirty?: boolean;
  uncommittedChanges?: GitFile[];
}

export interface GitFileNode {
  id?: string;
  path: string;
  name?: string;
  type: 'file' | 'dir';
  status?: 'added' | 'modified' | 'deleted' | 'unchanged';
  children?: GitFileNode[];
  commitIds?: string[];
  linkedItem?: GitLinkedItem;
}

  
export interface GitRepoMeta {
  repoUrl?: string;
  connected?: boolean;
  lastSync?: string;
  branch?: string;
}


