import React from 'react';
import clsx from 'clsx';
import type { PostType } from '../../types/postTypes';

type PostTypeBadgeProps = {
  type: PostType;
  className?: string;
};

const typeStyles: Record<PostType, { label: string; color: string }> = {
  free_speech: { label: 'Free Speech', color: 'bg-gray-100 text-gray-700' },
  request: { label: 'Request', color: 'bg-yellow-100 text-yellow-800' },
  log: { label: 'Log', color: 'bg-blue-100 text-blue-800' },
  task: { label: 'Task', color: 'bg-purple-100 text-purple-800' },
  quest: { label: 'Quest', color: 'bg-green-100 text-green-800' },
  meta_system: { label: 'System', color: 'bg-red-100 text-red-700' },
  meta_announcement: { label: 'Announcement', color: 'bg-indigo-100 text-indigo-800' },
  commit: { label: 'Commit', color: 'bg-pink-100 text-pink-800' },
  issue: { label: 'Issue', color: 'bg-orange-100 text-orange-800' },
  solved: { label: 'Solved', color: 'bg-lime-100 text-lime-800' },
};

export const PostTypeBadge: React.FC<PostTypeBadgeProps> = ({ type, className }) => {
  const style = typeStyles[type] ?? {
    label: type,
    color: 'bg-gray-200 text-gray-700',
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