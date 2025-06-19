import React from 'react';
import clsx from 'clsx';
import type { PostType } from '../../types/postTypes';

type PostTypeBadgeProps = {
  type: PostType;
  className?: string;
};

const typeStyles: Record<PostType, { label: string; color: string }> = {
  free_speech: {
    label: 'Free Speech',
    color:
      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  },
  request: {
    label: 'Request',
    color:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
  },
  log: {
    label: 'Log',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
  },
  task: {
    label: 'Task',
    color:
      'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200',
  },
  quest: {
    label: 'Quest',
    color:
      'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
  },
  meta_system: {
    label: 'System',
    color: 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-200',
  },
  meta_announcement: {
    label: 'Announcement',
    color:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200',
  },
  commit: {
    label: 'Commit',
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-200',
  },
  issue: {
    label: 'Issue',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200',
  },
  solved: {
    label: 'Solved',
    color: 'bg-lime-100 text-lime-800 dark:bg-lime-800 dark:text-lime-200',
  },
};

export const PostTypeBadge: React.FC<PostTypeBadgeProps> = ({ type, className }) => {
  const style = typeStyles[type] ?? {
    label: type,
    color: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <span
      className={clsx(
        'inline-block text-xs font-semibold px-2 py-1 rounded',
        style.color,
        className
      )}
    >
      {style.label}
    </span>
  );
};

export default PostTypeBadge;