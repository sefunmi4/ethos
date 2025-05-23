import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import PostTypeTag from '../PostTypeTag';

const PostHeader = ({ post, user, compact = false }) => {
  const timeAgo = formatDistanceToNow(new Date(post.timestamp), { addSuffix: true });
  const authorName = post.author?.name || 'Anonymous';

  return (
    <header className="flex justify-between items-start px-4 py-2 border-b bg-gray-50">
      <div className="flex flex-col">
        <div className="font-semibold text-gray-800">{authorName}</div>
        <div className="text-xs text-gray-500">{timeAgo}</div>
      </div>

      {!compact && (
        <div className="ml-auto">
          <PostTypeTag type={post.type} />
        </div>
      )}
    </header>
  );
};

export default PostHeader;
