import React, { useState, useEffect } from 'react';
import PostCard from '../post/PostCard';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import LogThreadPanel from './LogThreadPanel';
import FileEditorPanel from './FileEditorPanel';
import TaskKanbanBoard from './TaskKanbanBoard';
import QuickTaskForm from '../post/QuickTaskForm';
import TeamPanel from './TeamPanel';
import { useGraph } from '../../hooks/useGraph';
import { Select } from '../ui';
import { updatePost } from '../../api/post';
import { TASK_TYPE_OPTIONS, STATUS_OPTIONS } from '../../constants/options';
import type { option } from '../../constants/options';
import type { QuestTaskStatus } from '../../types/postTypes';

interface QuestNodeInspectorProps {
  questId: string;
  node: Post | null;
  user?: User;
  showPost?: boolean;
  showLogs?: boolean;
  status?: QuestTaskStatus;
  onStatusChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onUpdate?: (p: Post) => void;
  hideSelects?: boolean;
}

const QuestNodeInspector: React.FC<QuestNodeInspectorProps> = ({
  questId,
  node,
  user,
  showPost = true,
  showLogs = true,
  status,
  onStatusChange,
  onUpdate,
  hideSelects = false,
}) => {
  const [type, setType] = useState<string>(node?.taskType || 'abstract');
  const [activeTab, setActiveTab] = useState<'file' | 'logs' | 'options'>('logs');
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [boardOpen, setBoardOpen] = useState(true);
  const [statusVal, setStatusVal] = useState<QuestTaskStatus>(status || node?.status || 'To Do');
  const { loadGraph } = useGraph();

  useEffect(() => {
    setType(node?.taskType || 'abstract');
    setStatusVal(status || node?.status || 'To Do');
  }, [node?.taskType, node?.status, status]);

  useEffect(() => {
    setActiveTab('logs');
  }, [node?.id]);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setType(val);
    setActiveTab('file');
    if (node) {
      try {
        const updated = await updatePost(node.id, { taskType: val });
        onUpdate?.(updated);
        document.dispatchEvent(
          new CustomEvent('taskUpdated', { detail: { task: updated } })
        );
      } catch (err) {
        console.error('[QuestNodeInspector] Failed to update task type', err);
      }
    }
  };

  const handleStatusSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as QuestTaskStatus;
    setStatusVal(newStatus);
    onStatusChange?.(e);
    if (node) {
      try {
        const updated = await updatePost(node.id, { status: newStatus });
        onUpdate?.(updated);
        document.dispatchEvent(
          new CustomEvent('taskUpdated', { detail: { task: updated } })
        );
      } catch (err) {
        console.error('[QuestNodeInspector] Failed to update status', err);
      }
    }
  };

  const handleAddSubtask = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowSubtaskForm((prev) => !prev);
  };

  if (!node) return <div className="p-2 text-sm">Select a task</div>;

  const tabs = [
    {
      value: 'file',
      label: type === 'file' ? 'File' : type === 'folder' ? 'Folder' : 'Planner',
    },
    ...(showLogs ? [{ value: 'logs', label: 'Logs' }] : []),
    { value: 'options', label: 'Options' },
  ];

  let panel: React.ReactNode = null;
  switch (activeTab) {
    case 'logs':
      panel = <LogThreadPanel questId={questId} node={node} user={user} />;
      break;
    case 'file':
      panel = (
        <div className="space-y-2">
          <div className="border border-secondary rounded">
            <div
              className="flex items-center justify-between p-2 bg-soft cursor-pointer"
              onClick={() => setBoardOpen((prev) => !prev)}
            >
              <span className="font-semibold text-sm">Status Board</span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={handleAddSubtask}
                  className="text-xs text-accent underline"
                >
                  {showSubtaskForm ? '- Cancel Item' : '+ Add Item'}
                </button>
                <span className="text-xs">{boardOpen ? '▲' : '▼'}</span>
              </div>
            </div>
            {boardOpen && (
              <div className="p-2 space-y-2">
                {showSubtaskForm && (
                  <QuickTaskForm
                    questId={questId}
                    parentId={node.id}
                    boardId={`task-${node.id}`}
                    allowIssue
                    onSave={() => {
                      setShowSubtaskForm(false);
                      loadGraph(questId);
                    }}
                    onCancel={() => setShowSubtaskForm(false)}
                  />
                )}
                <TaskKanbanBoard
                  questId={questId}
                  linkedNodeId={node.id}
                  user={user}
                />
              </div>
            )}
          </div>
          {type === 'file' && (
            <FileEditorPanel
              questId={questId}
              filePath={node.gitFilePath || 'file.txt'}
              content={node.content}
            />
          )}
        </div>
      );
      break;
    case 'options':
      panel = <TeamPanel questId={questId} node={node} />;
      break;
    default:
      panel = null;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 space-y-2 flex-1 overflow-auto">
        {showPost && <PostCard post={node} user={user} questId={questId} />}
        {node.type === 'task' && !hideSelects && (
          <div className="space-y-2">
            <Select
              id="task-type"
              value={type}
              onChange={handleChange}
              options={TASK_TYPE_OPTIONS as option[]}
            />
            <Select
              id="task-status"
              value={statusVal}
              onChange={handleStatusSelect}
              options={STATUS_OPTIONS as option[]}
            />
          </div>
        )}
        <div className="border-b border-secondary flex items-center text-sm overflow-x-auto whitespace-nowrap">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value as typeof activeTab)}
              className={`px-3 py-1 -mb-px border-b-2 ${
                activeTab === t.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="mt-2">{panel}</div>
      </div>
    </div>
  );
};

export default QuestNodeInspector;