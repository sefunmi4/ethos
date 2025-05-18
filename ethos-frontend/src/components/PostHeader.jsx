import React from 'react';

const PostHeader = ({ type, timestamp, authorId, isOwner }) => {
  return (
    <div className="flex justify-between items-start mb-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="uppercase font-semibold">{type.replace('_', ' ')}</span>
        <span className="text-gray-400">• {timestamp}</span>
      </div>
      <a
        href={isOwner ? '/profile' : `/user/${authorId}`}
        className="text-blue-600 hover:underline font-medium"
        title={isOwner ? 'Your Profile' : 'View Profile'}
      >
        @{authorId?.slice(-5)}
      </a>
    </div>
  );
};

export default PostHeader;