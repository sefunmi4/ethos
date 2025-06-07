import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchGitStatus,
  updateGitRepo,
  syncGitRepo,
  removeGitRepo,
  archiveGitHistory,
  fetchGitDiff,
  fetchGitFileTree,
} from '../api/git';
import type { GitRepoMeta, GitFile } from '../types/gitTypes';

// Hook to fetch Git repo status for a quest
export const useGitStatus = (questId: string) => {
  return useQuery<GitRepoMeta>({
    queryKey: ['gitStatus', questId],
    queryFn: () => fetchGitStatus(questId),
    enabled: !!questId,
  });
};

// Hook to connect or update a Git repo
export const useUpdateGitRepo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      repoUrl,
      branch = 'main',
    }: {
      questId: string;
      repoUrl: string;
      branch?: string;
    }) => updateGitRepo(questId, repoUrl, branch),
    onSuccess: (_, { questId }) => {
        queryClient.invalidateQueries({
          queryKey: ['gitStatus', questId],
        });
    },
  });
};

// Hook to manually sync Git repo
export const useSyncGitRepo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questId: string) => syncGitRepo(questId),
    onSuccess: (_data, questId) => {
        queryClient.invalidateQueries({
          queryKey: ['gitStatus', questId],
        });
    },
  });
};

// Hook to disconnect/remove Git repo
export const useRemoveGitRepo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questId: string) => removeGitRepo(questId),
    onSuccess: (_, questId) => {
        queryClient.invalidateQueries({
          queryKey: ['gitStatus', questId],
        });
    },
  });
};

// Hook to archive Git commit history
export const useArchiveGitHistory = () => {
  return useMutation({
    mutationFn: (questId: string) => archiveGitHistory(questId),
  });
};

// Hook to get Git diff of a file or commit
export const useGitDiff = ({
  questId,
  filePath,
  commitId,
}: {
  questId: string;
  filePath?: string;
  commitId?: string;
}) => {
  return useQuery<{ diffMarkdown: string }>({
    queryKey: ['gitDiff', questId, filePath, commitId],
    queryFn: () => fetchGitDiff(questId, filePath, commitId),
    enabled: !!questId && (!!filePath || !!commitId),
  });
};

// Hook to fetch file/folder layout from Git
export const useGitFileTree = (questId: string) => {
  return useQuery<GitFile[]>({
    queryKey: ['gitFileTree', questId],
    queryFn: () => fetchGitFileTree(questId),
    enabled: !!questId,
  });
};