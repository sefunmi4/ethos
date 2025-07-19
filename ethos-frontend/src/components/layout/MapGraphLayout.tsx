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
  /** Custom handler when a node is clicked */
  onNodeClick?: (node: Post) => void;
}

const MapGraphLayout: React.FC<MapGraphLayoutProps> = ({
  items,
  edges = [],
  onNodeClick,
}) => {
  const fgRef =
    useRef<ForceGraphMethods<Post, { source: string; target: string }> | undefined>(
      undefined,
    );
  const containerRef = useRef<HTMLDivElement>(null);
  const [edgeList, setEdgeList] = useState<TaskEdge[]>(edges);

  useEffect(() => {
    setEdgeList(edges);
  }, [edges]);

  useEffect(() => {
    fgRef.current?.zoomToFit(200, 20);
  }, []);

  const data = useMemo(() => {
    const nodeSet = new Set(items.map((p) => p.id));
    const links = edgeList
      .filter((e) => nodeSet.has(e.from) && nodeSet.has(e.to))
      .map((e) => ({ source: e.from, target: e.to }));
    return {
      nodes: items.map((p) => ({ ...p, id: p.id, val: 4 })),
      links,
    };
  }, [items, edgeList]);


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

  const handleNodeDragEnd = () => {
    // reheat simulation to stabilize layout without changing edges
    fgRef.current?.d3ReheatSimulation();
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
        enableNodeDrag
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
