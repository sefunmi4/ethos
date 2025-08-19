import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaChevronRight, FaChevronDown } from 'react-icons/fa';
import { useGraph } from '../../../hooks/useGraph';
import TaskKanbanBoard from '../../quest/TaskKanbanBoard';
import SubtaskChecklist from '../../quest/SubtaskChecklist';
import TeamPanel from '../../quest/TeamPanel';
import { Select } from '../../ui';
import { VISIBILITY_OPTIONS, type option } from '../../../constants/options';
import { updatePost } from '../../../api/post';
import type { Post, EnrichedPost } from '../../../types/postTypes';

export type PostWithExtras = Post & Partial<EnrichedPost>;

interface TaskViewProps {
  post: PostWithExtras;
  expanded: boolean;
  compact?: boolean;
}

type TreeNode = {
  post: Post;
  children: TreeNode[];
};

const TaskView: React.FC<TaskViewProps> = ({ post }) => {
  const graph = useGraph();
  const loadGraph = graph.loadGraph;
  const [selected, setSelected] = useState<Post>(post);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ [post.id]: true });
  const [activeTab, setActiveTab] = useState<'planner' | 'options'>('planner');
  const [visibility, setVisibility] = useState(post.visibility || 'public');

  useEffect(() => {
    if (post.questId) {
      loadGraph(post.questId);
    }
  }, [post.questId, loadGraph]);

  useEffect(() => {
    const handler = () => {
      if (post.questId) loadGraph(post.questId);
    };
    window.addEventListener('taskUpdated', handler);
    return () => window.removeEventListener('taskUpdated', handler);
  }, [post.questId, loadGraph]);

  useEffect(() => {
    setVisibility(selected.visibility || 'public');
  }, [selected.visibility]);

  const buildTree = useCallback(
    (id: string): TreeNode[] => {
      const edges = graph.edges || [];
      const nodes = graph.nodes || [];
      return edges
        .filter(e => e.from === id)
        .map(e => {
          const child = nodes.find(n => n.id === e.to);
          return child ? { post: child, children: buildTree(child.id) } : null;
        })
        .filter((n): n is TreeNode => !!n);
    },
    [graph.edges, graph.nodes]
  );

  const tree: TreeNode = useMemo(() => ({ post, children: buildTree(post.id) }), [post, buildTree]);

  const toggle = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNode = (node: TreeNode): React.ReactNode => {
    const isExpanded = expandedNodes[node.post.id];
    const hasChildren = node.children.length > 0;
    return (
      <li key={node.post.id} className="pl-2">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => setSelected(node.post)}
        >
          {hasChildren && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); toggle(node.post.id); }}
              className="mr-1"
            >
              {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
            </button>
          )}
          <span className={selected.id === node.post.id ? 'font-semibold truncate' : 'truncate'}>
            {node.post.content}
          </span>
        </div>
        {hasChildren && isExpanded && (
          <ul className="ml-4">
            {node.children.map(child => renderNode(child))}
          </ul>
        )}
      </li>
    );
  };

  const handleVisibilityChange = async (val: string) => {
    setVisibility(val as 'public' | 'private');
    try {
      await updatePost(selected.id, { visibility: val });
    } catch (err) {
      console.error('[TaskView] failed to update visibility', err);
    }
  };

  return (
    <div className="flex gap-2 text-sm text-primary" data-testid="task-view">
      <div className="w-64 border border-secondary rounded p-2 overflow-auto">
        <ul>{renderNode(tree)}</ul>
      </div>
      <div className="flex-1 border border-secondary rounded p-2">
        <div className="flex border-b border-secondary mb-2 text-xs">
          <button
            className={`px-2 py-1 ${activeTab === 'planner' ? 'font-semibold' : ''}`}
            onClick={() => setActiveTab('planner')}
          >
            Planner
          </button>
          <button
            className={`px-2 py-1 ${activeTab === 'options' ? 'font-semibold' : ''}`}
            onClick={() => setActiveTab('options')}
          >
            Options
          </button>
        </div>
        {activeTab === 'planner' ? (
          selected.taskType === 'folder' ? (
            <TaskKanbanBoard questId={post.questId || ''} linkedNodeId={selected.id} />
          ) : (
            <SubtaskChecklist questId={post.questId || ''} nodeId={selected.id} />
          )
        ) : (
          <div className="space-y-4">
            <TeamPanel questId={post.questId || ''} node={selected} />
            <div>
              <label className="block mb-1 text-xs font-semibold">Visibility</label>
              <Select
                value={visibility}
                onChange={e => handleVisibilityChange(e.target.value)}
                options={VISIBILITY_OPTIONS as option[]}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskView;

