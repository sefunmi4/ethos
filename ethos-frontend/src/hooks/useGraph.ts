import { useState, useCallback } from 'react';
import type { Post } from '../types/postTypes';
import type { TaskEdge } from '../types/questTypes';
import { fetchQuestMapData } from '../api/quest';

/**
 * useGraph - A custom hook to manage quest graph data (nodes and edges).
 */
export const useGraph = () => {
  const [nodes, setNodes] = useState<Post[]>([]);
  const [edges, setEdges] = useState<TaskEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * loadGraph - Load post nodes and task edges for a specific quest.
   * @param questId - The quest ID whose graph should be loaded.
   */
  const loadGraph = useCallback(async (questId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { nodes, edges } = await fetchQuestMapData(questId);
      setNodes(nodes || []);
      setEdges(edges || []);
    } catch (err: unknown) {
      console.error('[useGraph] Failed to load quest map:', err);
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to load graph data.');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    nodes,
    edges,
    loading,
    error,
    loadGraph,
  };
};