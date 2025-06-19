import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import ContributionCard from '../contribution/ContributionCard';
import GitDiffViewer from '../git/GitDiffViewer';
import { Spinner } from '../ui';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import type { TaskEdge } from '../../types/questTypes';

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue},70%,70%)`;
};

interface NodeChild {
  node: Post;
  edge?: TaskEdge;
}

interface GraphNodeProps {
  node: Post & { children?: NodeChild[] };
  depth?: number;
  edge?: TaskEdge;
  user?: User;
  compact?: boolean;
  condensed?: boolean;
  selectedNode: Post | null;
  onSelect: (n: Post) => void;
  diffData?: { diffMarkdown?: string } | null;
  diffLoading: boolean;
  registerNode?: (id: string, el: HTMLDivElement | null) => void;
}

const GraphNode: React.FC<GraphNodeProps> = ({
  node,
  depth = 0,
  edge,
  user,
  compact = false,
  condensed = false,
  selectedNode,
  onSelect,
  diffData,
  diffLoading,
  registerNode,
}) => {
  const isFolder = node.type === 'quest' || node.tags.includes('quest');
  const icon = isFolder ? '📁' : '📄';

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: node.id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: node.id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  if (condensed) {
    const colorKey = node.tags[0] || node.type;
    const color = stringToColor(colorKey);
    const label = node.nodeId || node.id.slice(0, 6);
    const snippet = (node.content || '').slice(0, 30);
    return (
      <div className="relative" ref={(el) => registerNode?.(node.id, el)}>
        <div
          className="mb-2 flex items-center cursor-pointer"
          style={{ marginLeft: depth * 16 }}
          onClick={() => onSelect(node)}
          title={snippet}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white mr-2"
            style={{ backgroundColor: color }}
          >
            {label}
          </div>
          {edge && (
            <span className="text-xs text-gray-500 ml-1">{edge.label || edge.type}</span>
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
            {node.children.map(child => (
              <GraphNode
                key={child.node.id}
                node={child.node}
                depth={depth + 1}
                edge={child.edge}
                user={user}
                compact={compact}
                condensed={condensed}
                selectedNode={selectedNode}
                onSelect={onSelect}
                diffData={diffData}
                diffLoading={diffLoading}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={(el) => {
        setDropRef(el);
        registerNode?.(node.id, el);
      }}
      className={`relative ${isOver ? 'ring-2 ring-blue-400' : ''}`}
    >
      <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
        <div
          className={`ml-${depth * 4} mb-6 flex items-start space-x-2 cursor-pointer`}
          onClick={() => onSelect(node)}
          {...attributes}
          {...listeners}
        >
          <span className="text-xl select-none">{icon}</span>
          <ContributionCard contribution={node} user={user} compact={compact} />
          {edge && (
            <span className="text-xs text-gray-500 ml-1">{edge.label || edge.type}</span>
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
            {node.children.map(child => (
              <GraphNode
                key={child.node.id}
                node={child.node}
                depth={depth + 1}
                edge={child.edge}
                user={user}
                compact={compact}
                condensed={condensed}
                selectedNode={selectedNode}
                onSelect={onSelect}
                diffData={diffData}
                diffLoading={diffLoading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphNode;
