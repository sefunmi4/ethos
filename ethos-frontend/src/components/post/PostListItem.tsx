import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Post } from '../../types/postTypes';
import { getDisplayTitle } from '../../utils/displayUtils';
import PostCard from './PostCard';

interface PostListItemProps {
  post: Post;
}

const PostListItem: React.FC<PostListItemProps> = ({ post }) => {
  const [expanded, setExpanded] = useState(false);
  const timestamp = post.timestamp
    ? formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })
    : '';
  const header = getDisplayTitle(post);

  return (
    <div className="border-b border-secondary text-primary">
      <div
        className="flex justify-between items-center cursor-pointer py-2"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="text-sm font-semibold">
          {header}
          <span className="text-xs text-secondary ml-2">{timestamp}</span>
        </div>
        <span className="text-xs">{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div className="pb-2">
          <PostCard post={post} />
        </div>
      )}
    </div>
  );
};

export default PostListItem;
