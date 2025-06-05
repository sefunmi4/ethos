import { useState, useCallback } from 'react';
import { getMapData } from '../api/quest'; 
import type { Post } from '../types/postTypes';
import type { TaskEdge } from '../types/questTypes';

/**
 * useGraph - A custom React hook for managing and loading graph data.
 *
 * This hook is typically used in a board or quest context, where items are visualized
 * as nodes in a graph structure (e.g., tree layouts for post/quest relationships).
 */
export const useGraph = () => {
  const [nodes, setNodes] = useState<Post[]>([]); // 🧠 Nodes are Posts
  const [edges, setEdges] = useState<TaskEdge[]>([]); // 🔗 Edges are TaskEdges representing sub-problems/branches
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * loadGraph - Loads graph data for a given board or quest.
   * @param boardId - The unique ID of the board to fetch the graph for.
   */
  const loadGraph = useCallback(async (boardId: string) => {
    setLoading(true);
    setError(null);

    try {
      const mapData = await getMapData(boardId);

      // Expecting API response format: { nodes: Post[], edges: TaskEdge[] }
      setNodes(mapData.nodes || []);
      setEdges(mapData.edges || []);
    } catch (err: any) {
      console.error('[Graph] Failed to load graph data:', err);
      setError(err?.response?.data?.error || 'Failed to load graph.');
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

