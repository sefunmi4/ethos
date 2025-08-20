import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGraph } from '../../../hooks/useGraph';
import GraphLayout from '../../layout/GraphLayout';
import GitFileBrowserInline from '../../git/GitFileBrowserInline';
import InviteForm from '../../quest/InviteForm';
import { ROUTES } from '../../../constants/routes';
import { updatePost } from '../../../api/post';
import type { Post, EnrichedPost } from '../../../types/postTypes';
import type { Visibility } from '../../../types/common';
import type { TaskEdge } from '../../../types/questTypes';
import styles from './expandedCard.module.css';

export type PostWithExtras = Post & Partial<EnrichedPost>;

interface ProjectViewProps {
  post: PostWithExtras;
  expanded: boolean;
  compact?: boolean;
}

const ProjectView: React.FC<ProjectViewProps> = ({ post }) => {
  const navigate = useNavigate();
  const { nodes, edges, loadGraph } = useGraph();
  const [selected, setSelected] = useState<Post>(post);
  const [activeTab, setActiveTab] = useState<'folders' | 'options'>('folders');
  const [visibility, setVisibility] = useState<Visibility>(post.visibility || 'public');
  const [cascade, setCascade] = useState(false);
  const [lastClick, setLastClick] = useState<{ id: string; time: number } | null>(null);

  useEffect(() => {
    if (post.questId || post.id) {
      loadGraph(post.questId || post.id);
    }
  }, [post.questId, post.id, loadGraph]);

  useEffect(() => {
    setVisibility(selected.visibility || 'public');
  }, [selected.visibility]);

  const rootEdges = useMemo(() => {
    const childTargets = new Set((edges || []).map(e => e.to));
    const roots = (nodes || []).filter(n => !childTargets.has(n.id));
    return roots.map<TaskEdge>(r => ({ from: post.id, to: r.id, type: 'sub_problem' }));
  }, [edges, nodes, post.id]);

  const allNodes = useMemo(() => [post, ...(nodes || [])], [post, nodes]);
  const allEdges = useMemo(() => [...rootEdges, ...(edges || [])], [rootEdges, edges]);

  const handleNodeSelect = (n: Post) => {
    setSelected(n);
  };

  const handleNodeClick = (n: Post) => {
    const now = Date.now();
    if (lastClick && lastClick.id === n.id && now - lastClick.time < 300) {
      navigate(ROUTES.POST(n.id));
    }
    setLastClick({ id: n.id, time: now });
  };

  const handleVisibilityChange = async (val: Visibility) => {
    setVisibility(val);
    try {
      await updatePost(selected.id, { visibility: val, cascade });
    } catch (err) {
      console.error('[ProjectView] failed to update visibility', err);
    }
  };

  return (
    <div className={styles.split} data-testid="project-view">
      <div className={`${styles.panel} ${styles.sidebarWide}`}>
        <GraphLayout
          items={allNodes}
          edges={allEdges}
          questId={post.questId || post.id}
          onSelectNode={handleNodeSelect}
          onNodeClick={handleNodeClick}
          condensed
          showInspector={false}
        />
      </div>
      <div className={`${styles.panel} ${styles.main}`}>
        <div className={styles.tabList} role="tablist">
          <button
            id="folders-tab"
            role="tab"
            aria-selected={activeTab === 'folders'}
            aria-controls="folders-panel"
            tabIndex={activeTab === 'folders' ? 0 : -1}
            className={`${styles.tab} ${activeTab === 'folders' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('folders')}
          >
            Folders
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
          id="folders-panel"
          role="tabpanel"
          aria-labelledby="folders-tab"
          hidden={activeTab !== 'folders'}
          className="space-y-2"
        >
          {selected.type === 'task' ? (
            <>
              <a
                href={ROUTES.TASK(selected.id)}
                className="text-sm text-accent underline"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(ROUTES.TASK(selected.id));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    navigate(ROUTES.TASK(selected.id));
                  }
                }}
              >
                {selected.content}
              </a>
              <GitFileBrowserInline questId={selected.questId || ''} />
            </>
          ) : (
            <div>Select a task to view its folders.</div>
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
          {selected.type === 'task' && <InviteForm taskId={selected.id} />}
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

export default ProjectView;

