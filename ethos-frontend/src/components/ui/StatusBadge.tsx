import React from 'react';
import clsx from 'clsx';
import type { QuestTaskStatus } from '../../types/postTypes';

interface StatusBadgeProps {
  status: QuestTaskStatus;
  className?: string;
}

const statusStyles: Record<string, string> = {
  'To Do': 'bg-gray-100 text-gray-700',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  Blocked: 'bg-red-100 text-red-800',
  Done: 'bg-green-100 text-green-800',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const style = statusStyles[status] || 'bg-gray-200 text-gray-700';
  return (
    <span
      className={clsx(
        'inline-block text-xs font-semibold px-2 py-1 rounded',
        style,
        className
      )}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
