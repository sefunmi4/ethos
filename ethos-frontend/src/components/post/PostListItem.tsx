import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import type { PostWithQuestTitle } from '../../utils/displayUtils';
import { getDisplayTitle, buildSummaryTags } from '../../utils/displayUtils';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import SummaryTag from '../ui/SummaryTag';

const renderStars = (count: number) => (
  <span aria-label={`Rating: ${count}`} className="text-yellow-500 flex">
    {[1, 2, 3, 4, 5].map((n) => {
      const full = count >= n;
      const half = !full && count >= n - 0.5;
      return (
        <span key={n} className="mr-0.5">
          {full ? <FaStar /> : half ? <FaStarHalfAlt /> : <FaRegStar />}
        </span>
      );
    })}
  </span>
);

interface PostListItemProps {
  post: PostWithQuestTitle;
}

const PostListItem: React.FC<PostListItemProps> = ({ post }) => {
  const navigate = useNavigate();
  const timestamp = post.timestamp
    ? formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })
    : '';
  const header = getDisplayTitle(post, post.questTitle);
  const summaryTags = buildSummaryTags(post);

  return (
    <div
      className={clsx(
        'border-b border-secondary text-primary cursor-pointer py-2',
        post.highlight && 'bg-infoBackground'
      )}
      onClick={() => navigate(ROUTES.POST(post.id))}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm font-semibold">{header}</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {summaryTags.map((tag, idx) => (
              <SummaryTag key={idx} {...tag} />
            ))}
            {post.tags?.includes('review') && post.rating && renderStars(post.rating)}
          </div>
        </div>
        {timestamp && (
          <span className="text-xs text-secondary whitespace-nowrap ml-2">
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
};

export default PostListItem;
