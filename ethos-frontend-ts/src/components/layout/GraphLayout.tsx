import React, { useState, useEffect, useRef } from 'react';
import ContributionCard from '../contribution/ContributionCard';
import type { User } from '../../types/userTypes';
import type { Post } from '../../types/postTypes';

interface GraphLayoutProps {
  items: Post[];
  user?: User;
  compact?: boolean;
  questId?: string;
  onScrollEnd?: () => void;
  loadingMore?: boolean;
}

interface NodeMap {
  [id: string]: Post & { children?: Post[] };
}

const GraphLayout: React.FC<GraphLayoutProps> = ({
  items,
  user,
  compact = false,
  questId,
  onScrollEnd,
  loadingMore = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Build a tree from flat posts
  const [rootNodes, setRootNodes] = useState<(Post & { children?: Post[] })[]>([]);

  useEffect(() => {
    const nodeMap: NodeMap = {};
    const roots: (Post & { children?: Post[] })[] = [];

    items.forEach((item) => {
      nodeMap[item.id] = { ...item, children: [] };
    });

    items.forEach((item) => {
      const parentId = item.replyTo || item.repostedFrom?.originalPostId;
      if (parentId && nodeMap[parentId]) {
        nodeMap[parentId].children!.push(nodeMap[item.id]);
      } else {
        roots.push(nodeMap[item.id]);
      }
    });

    setRootNodes(roots);
  }, [items]);

  // Infinite scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || !onScrollEnd) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        onScrollEnd();
      }
    };

    const el = containerRef.current;
    if (el) el.addEventListener('scroll', handleScroll);
    return () => el?.removeEventListener('scroll', handleScroll);
  }, [onScrollEnd]);

  const renderNode = (node: Post & { children?: Post[] }, depth: number = 0) => {
    return (
      <div key={node.id} className="relative">
        <div className={`ml-${depth * 4} mb-6`}>
          <ContributionCard contribution={node} user={user} compact={compact} />
        </div>
        {node.children && node.children.length > 0 && (
          <div className="ml-8 border-l border-gray-300 pl-4">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="overflow-auto w-full h-full p-4 max-w-7xl mx-auto"
      style={{ minHeight: '50vh' }}
    >
      {rootNodes.map((node) => renderNode(node))}
      {loadingMore && (
        <p className="text-center text-gray-500 py-4">Loading more...</p>
      )}
    </div>
  );
};

export default GraphLayout;