import React, { useState } from 'react';
import { Select } from '../ui';
import { STATUS_OPTIONS } from '../../constants/options';
import type { Post, QuestTaskStatus } from '../../types/postTypes';

const makeHeader = (content: string): string => {
  const text = content.trim();
  return text.length <= 50 ? text : text.slice(0, 50) + '…';
};

interface CompactNodeCardProps {
  post: Post;
  onClick?: () => void;
  /** Whether to show the status dropdown for task posts */
  showStatus?: boolean;
}

const CompactNodeCard: React.FC<CompactNodeCardProps> = ({
  post,
  onClick,
  showStatus = true,
}) => {
  const [status, setStatus] = useState<QuestTaskStatus>(post.status || 'To Do');
  return (
    <div
      className="border border-secondary rounded bg-surface p-2 text-xs text-primary space-y-1 cursor-pointer"
      onClick={onClick}
    >
      <div className="font-semibold">{makeHeader(post.content || '')}</div>
      {showStatus && post.type === 'task' && (
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as QuestTaskStatus)}
          options={STATUS_OPTIONS.map(({ value, label }) => ({ value, label }))}
          className="w-full text-xs"
        />
      )}
    </div>
  );
};

export default CompactNodeCard;
