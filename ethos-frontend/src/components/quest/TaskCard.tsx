import React, { useEffect, useMemo, useState } from 'react';
import GraphLayout from '../layout/GraphLayout';
import { useGraph } from '../../hooks/useGraph';
import TaskPreviewCard from '../post/TaskPreviewCard';
import QuestNodeInspector from './QuestNodeInspector';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

interface TaskCardProps {
  task: Post;
  questId: string;
  user?: User;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, questId, user }) => {
  const { nodes, edges, loadGraph } = useGraph();
  const [selected, setSelected] = useState<Post>(task);

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
    <div className="border border-secondary rounded-lg bg-surface p-4 space-y-2">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <TaskPreviewCard post={selected} />
          <div className="h-80 overflow-auto" data-testid="task-graph-inline">
            <GraphLayout
              items={displayNodes}
              edges={displayEdges}
              user={user}
              questId={questId}
              condensed
              showInspector={false}
              showStatus={false}
              onSelectNode={setSelected}
            />
          </div>
        </div>
        <div className="w-full md:w-80 overflow-auto">
          <QuestNodeInspector questId={questId} node={selected} user={user} showPost={false} />
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
