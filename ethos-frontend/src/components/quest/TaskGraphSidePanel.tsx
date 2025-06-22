import React, { useEffect, useMemo } from 'react';
import GraphLayout from '../layout/GraphLayout';
import { useGraph } from '../../hooks/useGraph';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

interface TaskGraphSidePanelProps {
  task: Post;
  questId: string;
  user?: User;
  onClose: () => void;
}

const TaskGraphSidePanel: React.FC<TaskGraphSidePanelProps> = ({ task, questId, user, onClose }) => {
  const { nodes, edges, loadGraph } = useGraph();

  useEffect(() => {
    if (questId) {
      loadGraph(questId);
    }
  }, [questId, loadGraph]);

  const subgraphIds = useMemo(() => {
    const ids = new Set<string>();
    const gatherChildren = (id: string) => {
      ids.add(id);
      edges.filter(e => e.from === id).forEach(e => gatherChildren(e.to));
    };
    const gatherParents = (id: string) => {
      edges.filter(e => e.to === id).forEach(e => {
        if (!ids.has(e.from)) {
          ids.add(e.from);
          gatherParents(e.from);
        }
      });
    };
    gatherChildren(task.id);
    gatherParents(task.id);
    return ids;
  }, [task.id, edges]);

  const displayNodes = useMemo(() => nodes.filter(n => subgraphIds.has(n.id)), [nodes, subgraphIds]);
  const displayEdges = useMemo(() => edges.filter(e => subgraphIds.has(e.from) && subgraphIds.has(e.to)), [edges, subgraphIds]);

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-surface shadow-xl z-50 flex flex-col">
      <div className="p-2 border-b border-secondary text-right">
        <button className="text-xs underline" onClick={onClose}>Close</button>
      </div>
      <div className="flex-1 overflow-auto p-2">
        <GraphLayout
          items={displayNodes}
          edges={displayEdges}
          user={user}
          questId={questId}
          condensed
          showInspector={false}
          showStatus={false}
        />
      </div>
    </div>
  );
};

export default TaskGraphSidePanel;
