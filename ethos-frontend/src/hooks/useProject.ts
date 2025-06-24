import { useEffect, useState, useCallback } from 'react';
import type { Project } from '../types/projectTypes';
import { fetchProjectById, fetchAllProjects } from '../api/project';

export const useProject = (projectId?: string) => {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!projectId);

  useEffect(() => {
    if (!projectId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const p = await fetchProjectById(projectId);
        setProject(p);
      } catch (err) {
        setError('Failed to load project');
        console.error('[useProject] Failed to load project:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [projectId]);

  const getAllProjects = useCallback(async (): Promise<Project[]> => {
    try {
      return await fetchAllProjects();
    } catch (err) {
      console.error('[useProject] Failed to fetch projects:', err);
      return [];
    }
  }, []);

  return { project, error, isLoading, getAllProjects };
};
