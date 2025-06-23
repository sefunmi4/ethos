import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GraphLayout from '../layout/GraphLayout';
import { useGraph } from '../../hooks/useGraph';
import QuestNodeInspector from './QuestNodeInspector';
import TaskPreviewCard from '../post/TaskPreviewCard';
import { Select } from '../ui';
import { STATUS_OPTIONS } from '../../constants/options';
import { updatePost } from '../../api/post';
import { ROUTES } from '../../constants/routes';
import type { Post, QuestTaskStatus } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

interface TaskCardProps {
  task: Post;
  questId: string;
  user?: User;
  onUpdate?: (p: Post) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, questId, user, onUpdate }) => {
  const { nodes, edges, loadGraph } = useGraph();
  const [selected, setSelected] = useState<Post>(task);
  const [status, setStatus] = useState<QuestTaskStatus>(task.status || 'To Do');
  const navigate = useNavigate();

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

  const parentEdge = edges.find(e => e.to === task.id);
  const parentNode = parentEdge ? nodes.find(n => n.id === parentEdge.from) : undefined;

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as QuestTaskStatus;
    setStatus(newStatus);
    const optimistic = { ...task, status: newStatus };
    onUpdate?.(optimistic);
    try {
      const updated = await updatePost(task.id, { status: newStatus });
      onUpdate?.(updated);
    } catch (err) {
      console.error('[TaskCard] failed to update status', err);
    }
  };

  return (
    <div className="border border-secondary rounded-lg bg-surface p-4 space-y-2">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <TaskPreviewCard post={selected} summaryOnly />
          <div className="flex items-center justify-between">
            {parentNode && (
              <div
                className="w-px h-4 border-l-2 border-dotted border-secondary cursor-pointer"
                title={`Parent: ${parentNode.content.slice(0, 50)}`}
                onClick={() => navigate(ROUTES.POST(parentNode.id))}
              />
            )}
            <Select
              value={status}
              onChange={handleStatusChange}
              options={STATUS_OPTIONS as any}
              className="text-xs w-32"
            />
          </div>
          <div className="h-64 overflow-auto" data-testid="task-graph-inline">
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
