import React from 'react';
import clsx from 'clsx';
import type { QuestTaskStatus } from '../../types/postTypes';

interface StatusBadgeProps {
  status: QuestTaskStatus;
  className?: string;
}

const statusStyles: Record<string, string> = {
  'To Do': 'badge-info',
  'In Progress': 'badge-warning',
  Blocked: 'badge-error',
  Done: 'badge-success',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const style = statusStyles[status] || 'badge-info';
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
