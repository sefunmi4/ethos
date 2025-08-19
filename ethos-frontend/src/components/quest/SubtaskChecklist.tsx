import React, { useEffect } from 'react';
import { useGraph } from '../../hooks/useGraph';
import { updatePost } from '../../api/post';
import type { Post } from '../../types/postTypes';

interface SubtaskChecklistProps {
  questId: string;
  nodeId: string;
  indent?: number;
}

const SubtaskChecklist: React.FC<SubtaskChecklistProps> = ({ questId, nodeId, indent = 0 }) => {
  const graph = useGraph();
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];
  const loadGraph = graph.loadGraph;

  useEffect(() => {
    if (questId) loadGraph(questId);
  }, [questId, loadGraph]);

  const children = edges
    .filter(e => e.from === nodeId)
    .map(e => nodes.find(n => n.id === e.to))
    .filter((n): n is Post => !!n);

  const toggleStatus = async (task: Post) => {
    const newStatus = task.status === 'Done' ? 'To Do' : 'Done';
    try {
      await updatePost(task.id, { status: newStatus });
      await loadGraph(questId);
    } catch (err) {
      console.error('[SubtaskChecklist] failed to update status', err);
    }
  };

  if (children.length === 0) return null;

  return (
    <ul className="space-y-1" style={{ marginLeft: indent * 12 }}>
      {children.map(child => (
        <li key={child.id}>
          <label className="inline-flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={child.status === 'Done'}
              onChange={() => toggleStatus(child)}
            />
            <span className={child.status === 'Done' ? 'line-through' : ''}>
              {child.content}
            </span>
          </label>
          <SubtaskChecklist questId={questId} nodeId={child.id} indent={indent + 1} />
        </li>
      ))}
    </ul>
  );
};

export default SubtaskChecklist;
