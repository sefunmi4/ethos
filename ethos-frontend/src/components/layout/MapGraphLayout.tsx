import React, { useMemo, useEffect, useRef, useState } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import type { TaskEdge } from '../../types/questTypes';
import { getDisplayTitle } from '../../utils/displayUtils';

interface MapGraphLayoutProps {
  items: Post[];
  edges?: TaskEdge[];
  user?: User;
  questId?: string;
  compact?: boolean;
  onScrollEnd?: () => void;
  loadingMore?: boolean;
  /** Notify parent when the edge list updates */
  onEdgesChange?: (edges: TaskEdge[]) => void;
  /** Custom handler when a node is clicked */
  onNodeClick?: (node: Post) => void;
}

const MapGraphLayout: React.FC<MapGraphLayoutProps> = ({
  items,
  edges = [],
  onEdgesChange,
  onNodeClick,
}) => {
  const fgRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [edgeList, setEdgeList] = useState<TaskEdge[]>(edges);

  useEffect(() => {
    setEdgeList(edges);
  }, [edges]);

  useEffect(() => {
    fgRef.current?.zoomToFit(200, 20);
  }, [items, edgeList]);

  const data = useMemo(
    () => ({
      nodes: items.map((p) => ({ ...p, id: p.id, val: 4 })),
      links: edgeList.map((e) => ({ source: e.from, target: e.to })),
    }),
    [items, edgeList],
  );

  const emitEdges = (updated: TaskEdge[]) => {
    if (onEdgesChange) {
      onEdgesChange(updated);
    } else {
      window.dispatchEvent(
        new CustomEvent('questGraphUpdate', { detail: { edges: updated } }),
      );
    }
  };

  const isDescendant = (parentId: string, childId: string): boolean => {
    const visited = new Set<string>();
    const stack = [parentId];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === childId) return true;
      edgeList
        .filter((e) => e.from === current)
        .forEach((e) => {
          if (!visited.has(e.to)) {
            visited.add(e.to);
            stack.push(e.to);
          }
        });
    }
    return false;
  };

  const handleNodeClick = (node: unknown) => {
    const n = node as Post;
    if (onNodeClick) {
      onNodeClick(n);
    } else {
      window.dispatchEvent(
        new CustomEvent('questTaskOpen', { detail: { taskId: n.id } }),
      );
    }
  };

  const handleNodeDragEnd = (node: unknown) => {
    const dragged = node as Post & { x?: number; y?: number };
    const nodes = fgRef.current?.graphData().nodes || [];
    let targetId: string | null = null;
    let minDist = Infinity;
    nodes.forEach((n) => {
      const { id, x = 0, y = 0 } = n as Post & { x?: number; y?: number };
      if (id === dragged.id) return;
      const dx = (dragged.x ?? 0) - x;
      const dy = (dragged.y ?? 0) - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        targetId = id as string;
      }
    });

    if (minDist > 40) targetId = null;

    const nodeId = dragged.id;

    if (!targetId) {
      setEdgeList((prev) => {
        const updated = prev.filter((e) => e.to !== nodeId);
        if (updated !== prev) emitEdges(updated);
        return updated;
      });
      return;
    }

    if (nodeId === targetId) return;

    if (isDescendant(nodeId, targetId)) {
      return;
    }

    setEdgeList((prev) => {
      const filtered = prev.filter((e) => e.to !== nodeId);
      const exists = filtered.some(
        (e) => e.from === targetId && e.to === nodeId,
      );
      const updated = exists
        ? filtered
        : [...filtered, { from: targetId as string, to: nodeId }];
      if (updated !== prev) emitEdges(updated);
      return updated;
    });
    fgRef.current?.zoomToFit(200, 20);
  };

  return (
    <div
      ref={containerRef}
      className="overflow-auto w-full h-full p-2 max-w-7xl mx-auto"
      style={{ minHeight: '24vh', maxHeight: '40vh', border: '1px solid #ccc', position: 'relative' }}
    >
      <button
        type="button"
        onClick={() => fgRef.current?.zoomToFit(200, 20)}
        className="absolute right-2 top-2 z-10 bg-surface hover:bg-background rounded shadow px-2 py-1 text-xs"
      >
        Center Graph
      </button>
      <ForceGraph2D
        ref={fgRef}
        width={containerRef.current?.clientWidth || undefined}
        height={containerRef.current?.clientHeight || undefined}
        graphData={data}
        nodeId="id"
        nodeRelSize={6}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        nodeLabel={(node: unknown) => getDisplayTitle(node as Post)}
        onNodeClick={handleNodeClick}
        onNodeDragEnd={handleNodeDragEnd}
      />
    </div>
  );
};

export default MapGraphLayout;
