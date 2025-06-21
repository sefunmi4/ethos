import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Post } from '../../types/postTypes';
import { getDisplayTitle } from '../../utils/displayUtils';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

interface PostListItemProps {
  post: Post;
}

const PostListItem: React.FC<PostListItemProps> = ({ post }) => {
  const navigate = useNavigate();
  const timestamp = post.timestamp
    ? formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })
    : '';
  const header = getDisplayTitle(post);

  return (
    <div
      className="border-b border-secondary text-primary cursor-pointer py-2"
      onClick={() => navigate(ROUTES.POST(post.id))}
    >
      <div className="flex justify-between items-center">
        <div className="text-sm font-semibold">
          {header}
          <span className="text-xs text-secondary ml-2">{timestamp}</span>
        </div>
      </div>
    </div>
  );
};

export default PostListItem;
