import React from 'react';

/**
 * PostTypeTag provides a colored label for post type.
 * Helpful for quickly identifying content at a glance.
 */
const typeStyles = {
  free_speech: 'bg-blue-100 text-blue-800',
  request: 'bg-yellow-100 text-yellow-800',
  quest_log: 'bg-green-100 text-green-800',
  quest_task: 'bg-indigo-100 text-indigo-800',
  comment: 'bg-gray-100 text-gray-600',
  post: 'bg-gray-100 text-gray-700',
};

const PostTypeTag = ({ type = 'post' }) => {
  const className = typeStyles[type] || typeStyles.post;
  const label = type.replace(/_/g, ' ').toUpperCase();

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${className}`}>
      {label}
    </span>
  );
};

export default PostTypeTag;
