import React from 'react';
import clsx from 'clsx';
import type { QuestTaskStatus } from '../../types/postTypes';

interface StatusBadgeProps {
  status: QuestTaskStatus;
  className?: string;
}

const statusStyles: Record<string, string> = {
  'To Do': 'bg-soft text-secondary',
  'In Progress': 'bg-warning text-warning',
  Blocked: 'bg-error text-error',
  Done: 'bg-success text-success',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const style =
    statusStyles[status] || 'bg-soft text-secondary';
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
