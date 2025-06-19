import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { useGitDiff } from '../../hooks/useGit';
import { Spinner } from '../ui';
import GraphNode from './GraphNode';
import { linkPostToQuest } from '../../api/quest';
import type { User } from '../../types/userTypes';
import type { Post } from '../../types/postTypes';

import type { TaskEdge } from '../../types/questTypes';

interface GraphLayoutProps {
  items: Post[];
  edges?: TaskEdge[];
  user?: User;
  questId: string;
  compact?: boolean;
  /** Render a simplified node representation */
  condensed?: boolean;
  onScrollEnd?: () => void;
  loadingMore?: boolean;
}

interface NodeChild {
  node: Post;
  edge?: TaskEdge;
}

interface NodeMap {
  [id: string]: Post & { children?: NodeChild[] };
}

const GraphLayout: React.FC<GraphLayoutProps> = ({
  items,
  edges,
  user,
  questId,
  compact = false,
  condensed = false,
  onScrollEnd,
  loadingMore = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [paths, setPaths] = useState<{ key: string; d: string }[]>([]);

  const [rootNodes, setRootNodes] = useState<(Post & { children?: NodeChild[] })[]>([]);
  const [edgeList, setEdgeList] = useState<TaskEdge[]>(edges || []);
  const [selectedNode, setSelectedNode] = useState<Post | null>(null);

  const { data: diffData, isLoading: diffLoading } = useGitDiff({
    questId,
    filePath: selectedNode?.gitFilePath,
    commitId: selectedNode?.gitCommitSha,
  });

  const computePaths = () => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const newPaths: { key: string; d: string }[] = [];
    edgeList.forEach((edge) => {
      const fromEl = nodeRefs.current[edge.from];
      const toEl = nodeRefs.current[edge.to];
      if (fromEl && toEl) {
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        const startX =
          fromRect.left + fromRect.width / 2 - containerRect.left + container.scrollLeft;
        const startY =
          fromRect.bottom - containerRect.top + container.scrollTop;
        const endX =
          toRect.left + toRect.width / 2 - containerRect.left + container.scrollLeft;
        const endY = toRect.top - containerRect.top + container.scrollTop;
        newPaths.push({ key: `${edge.from}-${edge.to}`, d: `M ${startX} ${startY} L ${endX} ${endY}` });
      }
    });
    setPaths(newPaths);
  };

  useLayoutEffect(() => {
    computePaths();
  }, [rootNodes, edgeList]);

  useEffect(() => {
    window.addEventListener('resize', computePaths);
    return () => window.removeEventListener('resize', computePaths);
  }, [edgeList]);

  useEffect(() => {
    const nodeMap: NodeMap = {};
    const roots: (Post & { children?: NodeChild[] })[] = [];

    items.forEach((item) => {
      nodeMap[item.id] = { ...item, children: [] };
    });

    if (edgeList && edgeList.length > 0) {
      const toIds = new Set(edgeList.map((e) => e.to));
      edgeList.forEach((edge) => {
        const fromNode = nodeMap[edge.from];
        const toNode = nodeMap[edge.to];
        if (fromNode && toNode) {
          fromNode.children!.push({ node: toNode, edge });
        }
      });

      Object.values(nodeMap).forEach((node) => {
        if (!toIds.has(node.id)) {
          roots.push(node);
        }
      });
    } else {
      items.forEach((item) => {
        const parentId = item.replyTo || item.repostedFrom?.originalPostId;
        if (parentId && nodeMap[parentId]) {
          nodeMap[parentId].children!.push({ node: nodeMap[item.id] });
        } else {
          roots.push(nodeMap[item.id]);
        }
      });
    }

    setRootNodes(roots);
  }, [items, edgeList]);

  useEffect(() => {
    setEdgeList(edges || []);
  }, [edges]);

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

  const handleNodeClick = (n: Post) => {
    setSelectedNode(n);
    window.dispatchEvent(
      new CustomEvent('questTaskSelect', { detail: { taskId: n.id } })
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    try {
      await linkPostToQuest(questId, {
        postId: active.id as string,
        parentId: over.id as string,
      });
      setEdgeList((prev) => {
        const exists = prev.some(
          (e) => e.from === (over.id as string) && e.to === (active.id as string)
        );
        if (exists) return prev;
        return [...prev, { from: over.id as string, to: active.id as string }];
      });
    } catch (err) {
      console.error('[GraphLayout] failed to link post:', err);
    }
  };


  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div
        ref={containerRef}
        className={
          'overflow-auto w-full h-full p-4 max-w-7xl mx-auto ' +
          (rootNodes.length === 1 ? 'flex justify-center' : '')
        }
        style={{ minHeight: '50vh', position: 'relative' }}
      >
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#aaa" />
            </marker>
          </defs>
          {paths.map((p) => (
            <path key={p.key} d={p.d} stroke="#aaa" fill="none" markerEnd="url(#arrow)" />
          ))}
        </svg>
        {rootNodes.map((node) => (
          <GraphNode
            key={node.id}
            node={node}
            depth={0}
            user={user}
            compact={compact}
            condensed={condensed}
            selectedNode={selectedNode}
            onSelect={handleNodeClick}
            diffData={diffData}
            diffLoading={diffLoading}
            registerNode={(id, el) => {
              nodeRefs.current[id] = el;
            }}
          />
        ))}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        )}
      </div>
    </DndContext>
  );
};

export default GraphLayout;