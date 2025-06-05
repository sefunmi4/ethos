import { axiosWithAuth } from '../utils/authUtils';
import type { GitRepoMeta, GitCommit, GitFile } from '../types/gitTypes';

// Fetch the current git status for a quest
export const fetchGitStatus = async (questId: string): Promise<GitRepoMeta> => {
  const res = await axiosWithAuth.get(`/api/git/status/${questId}`);
  return res.data;
};

// Connect a new Git repo or update the connection
export const updateGitRepo = async (
  questId: string,
  repoUrl: string,
  branch: string = 'main'
): Promise<GitRepoMeta> => {
  const res = await axiosWithAuth.post(`/api/git/connect`, {
    questId,
    repoUrl,
    branch,
  });
  return res.data;
};

// Trigger a manual sync (pull latest, optional push local changes)
export const syncGitRepo = async (questId: string): Promise<GitRepoMeta> => {
  const res = await axiosWithAuth.post(`/api/git/sync`, { questId });
  return res.data;
};

// Remove git integration from quest
export const removeGitRepo = async (questId: string): Promise<{ success: boolean }> => {
  const res = await axiosWithAuth.delete(`/api/git/disconnect/${questId}`);
  return res.data;
};

// Archive commit history into a static markdown log
export const archiveGitHistory = async (
  questId: string
): Promise<{ archiveUrl: string }> => {
  const res = await axiosWithAuth.post(`/api/git/archive`, { questId });
  return res.data;
};

// Fetch git diff for a specific file or commit
export const fetchGitDiff = async (
  questId: string,
  filePath?: string,
  commitId?: string
): Promise<{ diffMarkdown: string }> => {
  const res = await axiosWithAuth.get(`/api/git/diff/${questId}`, {
    params: { filePath, commitId },
  });
  return res.data;
};

// Optional: fetch file tree
export const fetchGitFileTree = async (
  questId: string
): Promise<GitFile[]> => {
  const res = await axiosWithAuth.get(`/api/git/files/${questId}`);
  const { files, folders } = res.data;

  return [
    ...files.map((file: string) => ({
      name: file.split('/').pop() || file,
      path: file,
      type: 'file',
    })),
    ...folders.map((folder: string) => ({
      name: folder.split('/').pop() || folder,
      path: folder,
      type: 'folder',
    })),
  ];
};

/**
 * Fetch the commit history for a quest's Git repo.
 */
export const fetchGitCommitHistory = async (
  questId: string
): Promise<GitCommit[]> => {
  const res = await axiosWithAuth.get(`/api/git/commits/${questId}`);
  return res.data;
};

