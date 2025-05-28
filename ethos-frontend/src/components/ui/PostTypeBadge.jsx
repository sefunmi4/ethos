import React from 'react';
import { POST_TYPE_MAP } from '../../constants/POST_TYPES';

const PostTypeBadge = ({ type, className = '' }) => {
  const config = POST_TYPE_MAP[type] || {
    label: 'Unknown',
    color: 'bg-gray-100 text-gray-700',
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${config.color} ${className}`}
      title={config.description}
    >
      {config.label}
    </span>
  );
};

export default PostTypeBadge;