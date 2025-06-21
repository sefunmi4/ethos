import React, { useState } from 'react';
import { Select, StatusBadge } from '../ui';
import { STATUS_OPTIONS, TASK_TYPE_OPTIONS } from '../../constants/options';
import type { option } from '../../constants/options';
import type { Post, QuestTaskStatus } from '../../types/postTypes';

interface TaskPreviewCardProps {
  post: Post;
  onUpdate?: (updated: Post) => void;
}

const TaskPreviewCard: React.FC<TaskPreviewCardProps> = ({ post, onUpdate }) => {
  const [status, setStatus] = useState<QuestTaskStatus>(post.status || 'To Do');
  const [taskType, setTaskType] = useState(post.taskType || 'abstract');
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as QuestTaskStatus;
    setStatus(val);
    onUpdate?.({ ...post, status: val });
  };
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as 'file' | 'folder' | 'abstract';
    setTaskType(val);
    onUpdate?.({ ...post, taskType: val });
  };

  return (
    <div className="border border-secondary rounded bg-surface p-2 text-xs space-y-1">
      <div className="font-semibold text-sm">{post.content}</div>
      {post.gitFilePath && (
        <div className="text-secondary">{post.gitFilePath}</div>
      )}
      <div className="flex items-center gap-2">
        <StatusBadge status={status} />
        <Select
          value={status}
          onChange={handleStatusChange}
          options={STATUS_OPTIONS as option[]}
          className="text-xs"
        />
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={taskType}
          onChange={handleTypeChange}
          options={TASK_TYPE_OPTIONS as option[]}
          className="text-xs"
        />
        {taskType === 'file' && (
          <button className="text-accent underline text-xs">Make Main File</button>
        )}
        {taskType === 'folder' && (
          <button className="text-accent underline text-xs">Organize Dependencies</button>
        )}
      </div>
    </div>
  );
};

export default TaskPreviewCard;
