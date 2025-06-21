import React, { useEffect, useRef, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import ContributionCard from '../contribution/ContributionCard';
import CompactNodeCard from './CompactNodeCard';
import GitDiffViewer from '../git/GitDiffViewer';
import EditPost from '../post/EditPost';
import { Spinner } from '../ui';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import type { TaskEdge } from '../../types/questTypes';

export const MAX_CHILDREN_BEFORE_CONDENSE = 5;

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
  /** Show status dropdowns for task nodes */
  showStatus?: boolean;
  focusedNodeId?: string | null;
  onFocus?: (id: string) => void;
  selectedNode: Post | null;
  onSelect: (n: Post) => void;
  diffData?: { diffMarkdown?: string } | null;
  diffLoading: boolean;
  registerNode?: (id: string, el: HTMLDivElement | null) => void;
  onRemoveEdge?: (edge: TaskEdge) => void;
}

const GraphNode: React.FC<GraphNodeProps> = ({
  node,
  depth = 0,
  edge,
  user,
  compact = false,
  condensed = false,
  showStatus = true,
  focusedNodeId,
  onFocus,
  selectedNode,
  onSelect,
  diffData,
  diffLoading,
  registerNode,
  onRemoveEdge,
}) => {
  const isFolder = node.type === 'quest' || node.tags.includes('quest');
  const icon = isFolder ? '📁' : '📄';

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: node.id });
  const {
    attributes: anchorAttributes,
    listeners: anchorListeners,
    setNodeRef: setAnchorRef,
  } = useDraggable({ id: `anchor-${node.id}` });
  const {
    attributes: subtreeAttributes,
    listeners: subtreeListeners,
    setNodeRef: setSubtreeRef,
  } = useDraggable({ id: `move-${node.id}` });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: node.id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  const [pulsing, setPulsing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (isOver) {
      timerRef.current = setTimeout(() => setPulsing(true), 500);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setPulsing(false);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOver]);

  const shouldCondenseChildren =
    !focusedNodeId &&
    node.children &&
    node.children.length > MAX_CHILDREN_BEFORE_CONDENSE;

  if (editing) {
    return (
      <div
        ref={(el) => {
          setDropRef(el);
          registerNode?.(node.id, el);
        }}
        className={`relative ${isOver ? 'ring-2 ring-blue-400' : ''} ${pulsing ? 'animate-pulse' : ''}`}
      >
        <div
          ref={setNodeRef}
          style={style}
          className={isDragging ? 'opacity-50' : ''}
          {...attributes}
          {...listeners}
        >
          <div style={{ marginLeft: depth * 16 }} className="mb-6">
            <EditPost
              post={node}
              onCancel={() => {
                setEditing(false);
                setExpanded(false);
                onSelect(node);
              }}
              onUpdated={(p) => {
                setEditing(false);
                setExpanded(false);
                onSelect(p);
              }}
            />
          </div>
        </div>
      </div>
    );
  }


  if (condensed && !expanded) {
    const snippet = (node.content || '').slice(0, 30);
    return (
      <div
        className={`relative ${isOver ? 'ring-2 ring-blue-400' : ''} ${pulsing ? 'animate-pulse' : ''}`}
        ref={(el) => {
          setDropRef(el);
          registerNode?.(node.id, el);
        }}
      >
        <div
          ref={setNodeRef}
          style={style}
          className={isDragging ? 'opacity-50' : ''}
          {...attributes}
          {...listeners}
        >
          <div
            className="flex items-center text-xs cursor-pointer py-0.5 px-1 truncate"
            style={{ marginLeft: depth * 16 }}
            onClick={() => {
              setExpanded(true);
              onSelect(node);
              onFocus?.(node.id);
            }}
            title={snippet}
          >
            <span className="mr-1 select-none">{icon}</span>
            <span className="truncate">{snippet}{node.content && node.content.length > 30 ? '…' : ''}</span>
            {edge && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-1 flex items-center">
                {edge.label || edge.type}
                {onRemoveEdge && (
                  <button
                    data-testid={`remove-edge-${edge.from}-${edge.to}`}
                    className="ml-1 text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveEdge(edge);
                    }}
                  >
                    ×
                  </button>
                )}
              </span>
            )}
          </div>
        </div>
        {selectedNode?.id === node.id && (
          <div className="ml-8 mb-4">
            {diffLoading ? <Spinner /> : diffData?.diffMarkdown && (
              <GitDiffViewer markdown={diffData.diffMarkdown} />
            )}
          </div>
        )}
        {node.children && node.children.length > 0 && (
          <div className="ml-8 border-l border-gray-300 dark:border-gray-600 pl-4">
            {node.children.map((child) => (
              <GraphNode
                key={child.node.id}
                node={child.node}
                depth={depth + 1}
                edge={child.edge}
                user={user}
                compact={compact}
                condensed={
                  condensed ||
                  (shouldCondenseChildren && child.node.id !== focusedNodeId)
                }
                showStatus={showStatus}
                focusedNodeId={focusedNodeId}
                onFocus={onFocus}
                selectedNode={selectedNode}
                onSelect={onSelect}
                onRemoveEdge={onRemoveEdge}
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
      className={`relative ${isOver ? 'ring-2 ring-blue-400' : ''} ${pulsing ? 'animate-pulse' : ''}`}
    >
      <div
        ref={setNodeRef}
        style={style}
        className={isDragging ? 'opacity-50' : ''}
        {...attributes}
        {...listeners}
      >
        <div
          style={{ marginLeft: depth * 16 }}
          className="mb-6 flex items-start space-x-2 cursor-pointer"
          onClick={() => onSelect(node)}
        >
          <span className="text-xl select-none cursor-grab">
            {icon}
          </span>
          <ContributionCard
            contribution={node}
            user={user}
            compact={compact}
            showStatusControl={showStatus}
          />
          <span
            data-testid={`move-${node.id}`}
            ref={setSubtreeRef}
            {...subtreeAttributes}
            {...subtreeListeners}
            className="cursor-move text-xs ml-1"
            title="Move subtree"
          >
            ↕
          </span>
          <span
            data-testid={`anchor-${node.id}`}
            ref={setAnchorRef}
            {...anchorAttributes}
            {...anchorListeners}
            className="ml-1 w-3 h-3 bg-blue-400 rounded-full inline-block cursor-grab"
            title="Create child"
          />
          {expanded && !editing && (
            <button
              className="text-xs underline ml-1"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
            >
              Edit
            </button>
          )}
          {condensed && (
            <button
              className="text-xs underline ml-1"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(false);
              }}
              title="Collapse"
            >
              Collapse
            </button>
          )}
          {edge && (
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 flex items-center">
              {edge.label || edge.type}
              {onRemoveEdge && (
                <button
                  data-testid={`remove-edge-${edge.from}-${edge.to}`}
                  className="ml-1 text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveEdge(edge);
                  }}
                >
                  ×
                </button>
              )}
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
          <div className="ml-8 border-l border-gray-300 dark:border-gray-600 pl-4">
            {node.children.map((child) => (
              <GraphNode
                key={child.node.id}
                node={child.node}
                depth={depth + 1}
                edge={child.edge}
                user={user}
                compact={compact}
                condensed={
                  condensed ||
                  (shouldCondenseChildren && child.node.id !== focusedNodeId)
                }
                focusedNodeId={focusedNodeId}
                onFocus={onFocus}
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
