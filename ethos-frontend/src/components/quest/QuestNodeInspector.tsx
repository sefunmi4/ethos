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
import { TASK_TYPE_OPTIONS } from '../../constants/options';
import type { option } from '../../constants/options';

interface QuestNodeInspectorProps {
  questId: string;
  node: Post | null;
  user?: User;
  showPost?: boolean;
  showLogs?: boolean;
}

const QuestNodeInspector: React.FC<QuestNodeInspectorProps> = ({
  questId,
  node,
  user,
  showPost = true,
  showLogs = true,
}) => {
  const [type, setType] = useState<string>(node?.taskType || 'abstract');
  const [activeTab, setActiveTab] = useState<'logs' | 'file' | 'team'>('logs');
  const [showKanban, setShowKanban] = useState(false);
  const { loadGraph } = useGraph();

  useEffect(() => {
    setType(node?.taskType || 'abstract');
  }, [node?.taskType]);

  useEffect(() => {
    setActiveTab('logs');
  }, [node?.id]);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setType(val);
    if (node) {
      try {
        await updatePost(node.id, { taskType: val });
      } catch (err) {
        console.error('[QuestNodeInspector] Failed to update task type', err);
      }
    }
  };

  if (!node) return <div className="p-2 text-sm">Select a task</div>;

  const tabs = [
    ...(showLogs ? [{ value: 'logs', label: 'Logs' }] : []),
    {
      value: 'file',
      label: type === 'file' ? 'File' : type === 'folder' ? 'Folder' : 'Planner',
    },
    { value: 'team', label: 'Team' },
  ];

  const handleToggleKanban = () => {
    setShowKanban((p) => !p);
  };

  let panel: React.ReactNode = null;
  switch (activeTab) {
    case 'logs':
      panel = <LogThreadPanel questId={questId} node={node} user={user} />;
      break;
    case 'file':
      panel = (
        <div className="space-y-2">
          {showKanban && (
            <div className="space-y-2">
              <TaskKanbanBoard
                questId={questId}
                linkedNodeId={node.id}
                user={user}
              />
              <QuickTaskForm
                questId={questId}
                parentId={node.id}
                boardId={`task-${node.id}`}
                allowIssue
                onSave={() => {
                  setShowKanban(false);
                  loadGraph(questId);
                }}
                onCancel={() => setShowKanban(false)}
              />
            </div>
          )}
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
    case 'team':
      panel = <TeamPanel questId={questId} node={node} />;
      break;
    default:
      panel = null;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 space-y-2 flex-1 overflow-auto">
        {showPost && <PostCard post={node} user={user} questId={questId} />}
        {node.type === 'task' && (
          <Select
            id="task-type"
            value={type}
            onChange={handleChange}
            options={TASK_TYPE_OPTIONS as option[]}
          />
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
        {activeTab === 'file' && (
          <button
            onClick={handleToggleKanban}
            className="ml-auto px-2 text-accent underline whitespace-nowrap"
          >
            {showKanban ? '- Cancel Item' : '+ Add Item'}
          </button>
        )}
      </div>
        <div className="mt-2">{panel}</div>
      </div>
    </div>
  );
};

export default QuestNodeInspector;
