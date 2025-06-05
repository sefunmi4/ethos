import { useState, useCallback } from 'react';
import { getGraphData } from '../api/graph'; // 📡 API call to fetch graph layout
import type { GraphNode, GraphEdge } from '../types/graphTypes';

/**
 * useGraph - A custom React hook for managing and loading graph data.
 *
 * This hook is typically used in a board or quest context, where items are visualized
 * as nodes in a graph structure (e.g., tree layouts for post/quest relationships).
 */
export const useGraph = () => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
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
      const graphData = await getGraphData(boardId);

      // Expecting API response format: { nodes: GraphNode[], edges: GraphEdge[] }
      setNodes(graphData.nodes || []);
      setEdges(graphData.edges || []);
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