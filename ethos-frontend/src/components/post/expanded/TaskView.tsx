import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaChevronRight, FaChevronDown } from 'react-icons/fa';
import { useGraph } from '../../../hooks/useGraph';
import TaskKanbanBoard from '../../quest/TaskKanbanBoard';
import SubtaskChecklist from '../../quest/SubtaskChecklist';
import InviteForm from '../../quest/InviteForm';
import { updatePost } from '../../../api/post';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import type { Post, EnrichedPost } from '../../../types/postTypes';
import type { Visibility } from '../../../types/common';
import styles from './expandedCard.module.css';

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
  const navigate = useNavigate();
  const loadGraph = graph.loadGraph;
  const [selected, setSelected] = useState<Post>(post);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ [post.id]: true });
  const [activeTab, setActiveTab] = useState<'planner' | 'options'>('planner');
  const [visibility, setVisibility] = useState<Visibility>(
    post.visibility || 'public'
  );
  const [cascade, setCascade] = useState(false);

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
        <div className="flex items-center">
          {hasChildren && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); toggle(node.post.id); }}
              className="mr-1"
              aria-expanded={isExpanded}
            >
              {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
            </button>
          )}
          <a
            role="treeitem"
            aria-expanded={hasChildren ? isExpanded : undefined}
            href={ROUTES.TASK(node.post.id)}
            className={selected.id === node.post.id ? 'font-semibold truncate cursor-pointer' : 'truncate cursor-pointer'}
            onClick={(e) => {
              e.preventDefault();
              setSelected(node.post);
              navigate(ROUTES.TASK(node.post.id));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setSelected(node.post);
                navigate(ROUTES.TASK(node.post.id));
              }
              if (e.key === 'ArrowRight' && hasChildren && !isExpanded) toggle(node.post.id);
              if (e.key === 'ArrowLeft' && hasChildren && isExpanded) toggle(node.post.id);
            }}
          >
            {node.post.content}
          </a>
        </div>
        {hasChildren && isExpanded && (
          <ul className="ml-4" role="group">
            {node.children.map(child => renderNode(child))}
          </ul>
        )}
      </li>
    );
  };

  const handleVisibilityChange = async (val: Visibility) => {
    setVisibility(val);
    try {
      await updatePost(selected.id, { visibility: val, cascade });
    } catch (err) {
      console.error('[TaskView] failed to update visibility', err);
    }
  };

  return (
    <div className={styles.split} data-testid="task-view">
      <div className={`${styles.panel} ${styles.sidebar}`}>
        <ul role="tree">{renderNode(tree)}</ul>
      </div>
      <div className={`${styles.panel} ${styles.main}`}>
        <div className={styles.tabList} role="tablist">
          <button
            id="planner-tab"
            role="tab"
            aria-selected={activeTab === 'planner'}
            aria-controls="planner-panel"
            tabIndex={activeTab === 'planner' ? 0 : -1}
            className={`${styles.tab} ${activeTab === 'planner' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('planner')}
          >
            Planner
          </button>
          <button
            id="options-tab"
            role="tab"
            aria-selected={activeTab === 'options'}
            aria-controls="options-panel"
            tabIndex={activeTab === 'options' ? 0 : -1}
            className={`${styles.tab} ${activeTab === 'options' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('options')}
          >
            Options
          </button>
        </div>
        <div
          id="planner-panel"
          role="tabpanel"
          aria-labelledby="planner-tab"
          hidden={activeTab !== 'planner'}
        >
          {selected.taskType === 'folder' ? (
            <TaskKanbanBoard questId={post.questId || ''} linkedNodeId={selected.id} />
          ) : (
            <SubtaskChecklist questId={post.questId || ''} nodeId={selected.id} />
          )}
        </div>
        <div
          id="options-panel"
          role="tabpanel"
          aria-labelledby="options-tab"
          hidden={activeTab !== 'options'}
          className="space-y-4"
        >
          <div>
            <label className="block mb-1 text-xs font-semibold">Members</label>
            <ul className="ml-4 list-disc text-sm">
              {(selected.collaborators || []).map((c, i) => (
                <li key={i}>
                  {c.username ? `@${c.username}` : 'Unknown'}
                  {c.roles && c.roles.length ? ` - ${c.roles.join(', ')}` : ''}
                </li>
              ))}
            </ul>
          </div>
          <InviteForm taskId={selected.id} />
          <div>
            <label className="block mb-1 text-xs font-semibold">Visibility</label>
            <label className="inline-flex items-center text-xs">
              <input
                type="checkbox"
                className="mr-2"
                checked={visibility === 'private'}
                onChange={e => handleVisibilityChange(e.target.checked ? 'private' : 'public')}
              />
              Private
            </label>
            <label className="mt-1 inline-flex items-center text-xs">
              <input
                type="checkbox"
                className="mr-1"
                checked={cascade}
                onChange={e => setCascade(e.target.checked)}
              />
              Cascade to subtasks
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskView;
