// src/components/layout/GraphLayout.tsx

import React, { useState } from 'react';
import ContributionCard from '../contribution/ContributionCard';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

/**
 * Extended tree node interface for quest graph.
 * Includes post content and recursive children.
 */
export interface QuestNodeData extends Post {
  children?: QuestNodeData[];
}

// Props for a single rendered node in the graph
interface QuestNodeProps {
  node: QuestNodeData;
  level?: number;
  user?: User;

  // Optional callbacks for interactivity
  onClickNode?: (node: QuestNodeData) => void;
  onAddChild?: (parentId: string) => void;
}

/**
 * Recursive UI component to render a single node and its children in the tree.
 */
const QuestNode: React.FC<QuestNodeProps> = ({
  node,
  level = 0,
  user,
  onClickNode,
  onAddChild,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const hasChildren = node.children && node.children.length > 0;
  const indent = level * 16; // Visual left indent per level

  return (
    <div className="ml-2 border-l border-gray-300 pl-4 mb-4">
      <div className="flex items-start gap-2">
        {/* Expand/collapse toggle if node has children */}
        {hasChildren && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-xs text-gray-500 hover:underline"
          >
            {collapsed ? '[+]' : '[–]'}
          </button>
        )}

        {/* Clickable post card */}
        <div
          className="flex-1 cursor-pointer"
          onClick={() => onClickNode?.(node)}
          style={{ marginLeft: indent }}
        >
          <ContributionCard contribution={node} user={user} />
        </div>

        {/* Optional: add child node */}
        {onAddChild && (
          <button
            onClick={() => onAddChild(node.id)}
            className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
            title="Add Sub-Task"
          >
            ➕
          </button>
        )}
      </div>

      {/* Render children if not collapsed */}
      {!collapsed && hasChildren && (
        <div className="mt-2 space-y-2">
          {node.children?.map((child) => (
            <QuestNode
              key={child.id}
              node={child}
              level={level + 1}
              user={user}
              onClickNode={onClickNode}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Full graph props (used for pages like /quest/[id])
interface GraphLayoutProps {
  items: QuestNodeData[]; // Root-level quest(s)
  user?: User;
  compact?: boolean;
  loadingMore?: boolean;
  onScrollEnd?: () => void;

  // Interactivity callbacks
  onClickNode?: (node: QuestNodeData) => void;
  onAddChild?: (parentId: string) => void;
}

/**
 * Main graph layout to render a tree of posts representing a quest structure.
 */
const GraphLayout: React.FC<GraphLayoutProps> = ({
  items,
  user,
  loadingMore = false,
  onClickNode,
  onAddChild,
}) => {
  if (!items || items.length === 0) {
    return <p className="text-gray-500">No quest structure available.</p>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {items.map((root) => (
        <QuestNode
          key={root.id}
          node={root}
          user={user}
          onClickNode={onClickNode}
          onAddChild={onAddChild}
        />
      ))}

      {loadingMore && <p className="text-center text-gray-400 mt-4">Loading more...</p>}
    </div>
  );
};

export default GraphLayout;