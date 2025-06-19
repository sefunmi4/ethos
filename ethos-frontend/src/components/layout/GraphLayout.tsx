import React, { useState, useEffect, useRef } from 'react';
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useGitDiff } from '../../hooks/useGit';
import GitDiffViewer from '../git/GitDiffViewer';
import { Spinner } from '../ui';
import ContributionCard from '../contribution/ContributionCard';
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
  onScrollEnd,
  loadingMore = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [rootNodes, setRootNodes] = useState<(Post & { children?: NodeChild[] })[]>([]);
  const [edgeList, setEdgeList] = useState<TaskEdge[]>(edges || []);
  const [selectedNode, setSelectedNode] = useState<Post | null>(null);

  const { data: diffData, isLoading: diffLoading } = useGitDiff({
    questId,
    filePath: selectedNode?.gitFilePath,
    commitId: selectedNode?.gitCommitSha,
  });

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
      setEdgeList((prev) => [
        ...prev,
        { from: over.id as string, to: active.id as string },
      ]);
    } catch (err) {
      console.error('[GraphLayout] failed to link post:', err);
    }
  };

  const renderNode = (
    node: Post & { children?: NodeChild[] },
    depth: number = 0,
    edge?: TaskEdge
  ) => {
    const isFolder = node.type === 'quest' || node.tags.includes('quest');
    const icon = isFolder ? '📁' : '📄';

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging,
    } = useDraggable({ id: node.id });
    const { setNodeRef: setDropRef, isOver } = useDroppable({ id: node.id });
    const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

    return (
      <div
        key={node.id}
        ref={setDropRef}
        className={`relative ${isOver ? 'ring-2 ring-blue-400' : ''}`}
      >
        <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
          <div
            className={`ml-${depth * 4} mb-6 flex items-start space-x-2 cursor-pointer`}
            onClick={() => handleNodeClick(node)}
            {...attributes}
            {...listeners}
          >
            <span className="text-xl select-none">{icon}</span>
            <ContributionCard contribution={node} user={user} compact={compact} />
            {edge && (
              <span className="text-xs text-gray-500 ml-1">
                {edge.label || edge.type}
              </span>
            )}
          </div>
          {selectedNode?.id === node.id && (
            <div className="ml-8 mb-4">
              {diffLoading ? <Spinner /> : diffData?.diffMarkdown && (
                <GitDiffViewer markdown={diffData.diffMarkdown} />
              )}
            </div>
          )}
          {node.children && node.children.length > 0 && (
            <div className="ml-8 border-l border-gray-300 pl-4">
              {node.children.map((child) =>
                renderNode(child.node, depth + 1, child.edge)
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div
        ref={containerRef}
        className={
          'overflow-auto w-full h-full p-4 max-w-7xl mx-auto ' +
          (rootNodes.length === 1 ? 'flex justify-center' : '')
        }
        style={{ minHeight: '50vh' }}
      >
        {rootNodes.map((node) => renderNode(node))}
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