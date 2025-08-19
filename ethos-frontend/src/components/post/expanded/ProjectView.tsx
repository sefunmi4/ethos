import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGraph } from '../../../hooks/useGraph';
import GraphLayout from '../../layout/GraphLayout';
import GitFileBrowserInline from '../../git/GitFileBrowserInline';
import TeamPanel from '../../quest/TeamPanel';
import { Select } from '../../ui';
import { VISIBILITY_OPTIONS } from '../../../constants/options';
import { ROUTES } from '../../../constants/routes';
import { updatePost } from '../../../api/post';
import type { Post, EnrichedPost } from '../../../types/postTypes';
import type { Visibility } from '../../../types/common';
import type { TaskEdge } from '../../../types/questTypes';

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
    <div className="flex gap-2 text-sm text-primary" data-testid="project-view">
      <div className="w-72 border border-secondary rounded p-2 overflow-auto">
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
      <div className="flex-1 border border-secondary rounded p-2">
        <div className="flex border-b border-secondary mb-2 text-xs">
          <button
            className={`px-2 py-1 ${activeTab === 'folders' ? 'font-semibold' : ''}`}
            onClick={() => setActiveTab('folders')}
          >
            Folders
          </button>
          <button
            className={`px-2 py-1 ${activeTab === 'options' ? 'font-semibold' : ''}`}
            onClick={() => setActiveTab('options')}
          >
            Options
          </button>
        </div>
        {activeTab === 'folders' ? (
          selected.type === 'task' ? (
            <div className="space-y-2">
              <Link
                to={ROUTES.POST(selected.id)}
                className="text-sm text-accent underline"
              >
                {selected.content}
              </Link>
              <GitFileBrowserInline questId={selected.questId || ''} />
            </div>
          ) : (
            <div>Select a task to view its folders.</div>
          )
        ) : (
          <div className="space-y-4">
            <TeamPanel questId={post.questId || ''} node={selected} />
            <div>
              <label className="block mb-1 text-xs font-semibold">Visibility</label>
              <Select
                value={visibility}
                onChange={e => handleVisibilityChange(e.target.value as Visibility)}
                options={VISIBILITY_OPTIONS}
              />
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
        )}
      </div>
    </div>
  );
};

export default ProjectView;

