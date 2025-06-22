import React, { useState, useEffect } from 'react';
import PostCard from '../post/PostCard';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import LogThreadPanel from './LogThreadPanel';
import FileEditorPanel from './FileEditorPanel';
import StatusBoardPanel from './StatusBoardPanel';
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
  const [activeTab, setActiveTab] = useState<'status' | 'logs' | 'file'>('status');

  useEffect(() => {
    setType(node?.taskType || 'abstract');
  }, [node?.taskType]);

  useEffect(() => {
    setActiveTab('status');
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
    { value: 'status', label: 'Status' },
    ...(showLogs ? [{ value: 'logs', label: 'Logs' }] : []),
    { value: 'file', label: 'File/Folder' },
  ];

  let panel: React.ReactNode = null;
  switch (activeTab) {
    case 'logs':
      panel = <LogThreadPanel questId={questId} node={node} user={user} />;
      break;
    case 'file':
      panel = (
        <FileEditorPanel
          questId={questId}
          filePath={node.gitFilePath || 'file.txt'}
          content={node.content}
        />
      );
      break;
    case 'status':
    default:
      panel = <StatusBoardPanel questId={questId} linkedNodeId={node.id} />;
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
        <div className="border-b border-secondary flex text-sm overflow-x-auto whitespace-nowrap">
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
