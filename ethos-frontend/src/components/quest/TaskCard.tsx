import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GraphLayout from '../layout/GraphLayout';
import MapGraphLayout from '../layout/MapGraphLayout';
import StatusBoardPanel from './StatusBoardPanel';
import { useGraph } from '../../hooks/useGraph';
import QuestNodeInspector from './QuestNodeInspector';
import TaskPreviewCard from '../post/TaskPreviewCard';
import QuickTaskForm from '../post/QuickTaskForm';
import { Select } from '../ui';
import { STATUS_OPTIONS, TASK_TYPE_OPTIONS } from '../../constants/options';
import type { option } from '../../constants/options';
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
  const [taskType, setTaskType] = useState<string>(task.taskType || 'abstract');
  const [detailWidth, setDetailWidth] = useState<number>(400);
  const [activeTab, setActiveTab] = useState<'details' | 'folder'>('details');
  const [showFolderForm, setShowFolderForm] = useState(false);
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
      edges.filter((e) => e.from === id).forEach((e) => gatherChildren(e.to));
    };
    gatherChildren(task.id);
    return ids;
  }, [task.id, edges]);

  const displayNodes = useMemo(() => nodes.filter(n => subgraphIds.has(n.id)), [nodes, subgraphIds]);
  const displayEdges = useMemo(() => edges.filter(e => subgraphIds.has(e.from) && subgraphIds.has(e.to)), [edges, subgraphIds]);

  const parentEdge = edges.find(e => e.to === task.id);
  const parentNode = parentEdge ? nodes.find(n => n.id === parentEdge.from) : undefined;

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as QuestTaskStatus;
    setStatus(newStatus);
    try {
      const updated = await updatePost(selected.id, { status: newStatus });
      setSelected(updated);
      onUpdate?.(updated);
      document.dispatchEvent(new CustomEvent('taskUpdated', { detail: { task: updated } }));
    } catch (err) {
      console.error('[TaskCard] Failed to update status', err);
    }
  };

  const handleTypeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setTaskType(val);
    try {
      const updated = await updatePost(selected.id, { taskType: val });
      setSelected(updated);
      onUpdate?.(updated);
      document.dispatchEvent(new CustomEvent('taskUpdated', { detail: { task: updated } }));
    } catch (err) {
      console.error('[TaskCard] Failed to update task type', err);
    }
  };

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
          <div className="border-b border-secondary flex text-sm overflow-x-auto whitespace-nowrap">
            <button
              className={`px-3 py-1 -mb-px border-b-2 ${
                activeTab === 'details'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            {taskType === 'folder' && (
              <button
                className={`px-3 py-1 -mb-px border-b-2 ${
                  activeTab === 'folder'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-secondary hover:text-primary'
                }`}
                onClick={() => setActiveTab('folder')}
              >
                Folder
              </button>
            )}
          </div>
          {activeTab === 'details' ? (
            <QuestNodeInspector
              questId={questId}
              node={selected}
              user={user}
              showPost={false}
              onUpdate={onUpdate}
              status={status}
              hideSelects
            />
          ) : (
            <div className="space-y-2 p-2">
              <StatusBoardPanel questId={questId} linkedNodeId={selected.id} />
              {showFolderForm && (
                <QuickTaskForm
                  questId={questId}
                  parentId={selected.id}
                  boardId={`task-${selected.id}`}
                  allowIssue
                  onSave={() => setShowFolderForm(false)}
                  onCancel={() => setShowFolderForm(false)}
                />
              )}
              <div className="text-right">
                <button
                  onClick={() => setShowFolderForm((p) => !p)}
                  className="text-xs text-accent underline"
                >
                  {showFolderForm ? '- Cancel' : '+ Add Item'}
                </button>
              </div>
              <div className="h-64 overflow-auto">
                <GraphLayout
                  items={displayNodes}
                  edges={displayEdges}
                  questId={questId}
                  condensed
                  showInspector={false}
                  showStatus={false}
                  onNodeClick={(n) => {
                    if (n.id !== task.id) {
                      navigate(ROUTES.POST(n.id));
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
