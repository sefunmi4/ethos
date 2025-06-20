import React, { useMemo } from 'react';
import ForceGraph2D from 'react-force-graph';
import type { Post } from '../../types/postTypes';
import type { TaskEdge } from '../../types/questTypes';
import { getDisplayTitle } from '../../utils/displayUtils';

interface MapGraphLayoutProps {
  items: Post[];
  edges?: TaskEdge[];
  user?: any;
  questId?: string;
  compact?: boolean;
  onScrollEnd?: () => void;
  loadingMore?: boolean;
}

const MapGraphLayout: React.FC<MapGraphLayoutProps> = ({ items, edges = [] }) => {
  const data = useMemo(() => ({
    nodes: items.map((p) => ({ ...p, id: p.id })),
    links: edges.map((e) => ({ source: e.from, target: e.to })),
  }), [items, edges]);

  return (
    <div style={{ height: '70vh' }}>
      <ForceGraph2D
        graphData={data}
        nodeId="id"
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        nodeLabel={(node: any) => getDisplayTitle(node as Post)}
      />
    </div>
  );
};

export default MapGraphLayout;
