import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MapGraphLayout from '../layout/MapGraphLayout';
import { useGraph } from '../../hooks/useGraph';
import QuestNodeInspector from './QuestNodeInspector';
import TaskPreviewCard from '../post/TaskPreviewCard';
import { updateQuestTaskGraph } from '../../api/quest';
import { ROUTES } from '../../constants/routes';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import type { TaskEdge } from '../../types/questTypes';

interface TaskCardProps {
  task: Post;
  questId: string;
  user?: User;
  onUpdate?: (p: Post) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, questId, user, onUpdate }) => {
  const { nodes, edges, loadGraph } = useGraph();
  const [selected, setSelected] = useState<Post>(task);
  const [detailWidth, setDetailWidth] = useState<number>(400);
  const navigate = useNavigate();

  const handleNodeUpdate = (updated: Post) => {
    setSelected(updated);
    onUpdate?.(updated);
  };

  useEffect(() => {
    setSelected(task);
  }, [task]);

  useEffect(() => {
    if (questId) {
      loadGraph(questId);
    }
  }, [questId, loadGraph]);

  const handleEdgesSave = async (edgesToSave: TaskEdge[]) => {
    try {
      await updateQuestTaskGraph(questId, edgesToSave);
      await loadGraph(questId);
    } catch (err) {
      console.error('[TaskCard] Failed to save task graph', err);
    }
  };

  const subgraphIds = useMemo(() => {
    const ids = new Set<string>();
    const gatherChildren = (id: string) => {
      ids.add(id);
      edges.filter((e) => e.from === id).forEach((e) => gatherChildren(e.to));
    };
    gatherChildren(task.id);
    return ids;
  }, [task.id, edges]);

  const displayNodes = useMemo(() => nodes.filter(n => subgraphIds.has(n.id)), [nodes, subgraphIds]);
  const displayEdges = useMemo(() => edges.filter(e => subgraphIds.has(e.from) && subgraphIds.has(e.to)), [edges, subgraphIds]);

  const parentEdge = edges.find(e => e.to === task.id);
  const parentNode = parentEdge ? nodes.find(n => n.id === parentEdge.from) : undefined;


  const handleDividerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const startX = e.clientX;
    const startWidth = detailWidth;
    const onMove = (ev: MouseEvent) => {
      const newWidth = Math.min(600, Math.max(260, startWidth - (ev.clientX - startX)));
      setDetailWidth(newWidth);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div className="border border-secondary rounded-lg bg-surface p-4 space-y-2">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-2 md:pr-4" style={{ minWidth: 240 }}>
          <TaskPreviewCard post={selected} summaryOnly />
          <div className="flex items-center justify-between">
            {parentNode && (
              <div
                className="w-px h-4 border-l-2 border-dotted border-secondary cursor-pointer"
                title={`Parent: ${parentNode.content.slice(0, 50)}`}
                onClick={() => navigate(ROUTES.POST(parentNode.id))}
              />
            )}
          </div>
          <div className="h-64 overflow-auto" data-testid="task-map-inline">
            <MapGraphLayout
              items={displayNodes}
              edges={displayEdges}
              onEdgesChange={handleEdgesSave}
              onNodeClick={(n) => {
                if (n.id !== task.id) {
                  navigate(ROUTES.POST(n.id));
                }
              }}
            />
          </div>
        </div>
        <div className="hidden md:block w-1.5 bg-gray-200 dark:bg-gray-600 cursor-ew-resize" onMouseDown={handleDividerMouseDown} />
        <div className="overflow-auto" style={{ width: detailWidth }}>
          <QuestNodeInspector
            questId={questId}
            node={selected}
            user={user}
            showPost={false}
            onUpdate={handleNodeUpdate}
            hideSelects
          />
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
