import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Post } from '../../types/postTypes';

interface PostListItemProps {
  post: Post;
}

const PostListItem: React.FC<PostListItemProps> = ({ post }) => {
  const timestamp = post.timestamp
    ? formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })
    : '';
  const content = post.renderedContent || post.content || '';
  const excerpt = content.length > 120 ? content.slice(0, 120) + '…' : content;

  return (
    <div className="py-3 border-b border-secondary text-primary space-y-1">
      <div className="text-sm">
        <strong>@{post.author?.username || post.authorId}</strong>{' '}
        <span className="text-secondary text-xs">{timestamp}</span>
      </div>
      <div className="text-sm">{excerpt}</div>
    </div>
  );
};

export default PostListItem;
