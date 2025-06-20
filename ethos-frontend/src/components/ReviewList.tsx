import React, { useEffect, useState } from 'react';
import { fetchReviews } from '../api/review';
import type { Review, ReviewTargetType } from '../types/reviewTypes';
import { Select, Spinner } from './ui';

interface ReviewListProps {
  type: ReviewTargetType;
  questId?: string;
  postId?: string;
  className?: string;
}

const ReviewList: React.FC<ReviewListProps> = ({ type, questId, postId, className }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sort, setSort] = useState<'recent' | 'highest'>('recent');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchReviews({ type, questId, postId, sort });
        setReviews(data || []);
      } catch (err) {
        console.error('[ReviewList] Failed to fetch reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [type, questId, postId, sort]);

  const renderStars = (count: number) => {
    return (
      <span className="text-yellow-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i}>{i < count ? '★' : '☆'}</span>
        ))}
      </span>
    );
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Reviews</h3>
        <div className="w-32">
          <Select
            value={sort}
            onChange={e => setSort(e.target.value as 'recent' | 'highest')}
            options={[
              { value: 'recent', label: 'Most Recent' },
              { value: 'highest', label: 'Highest Rated' },
            ]}
          />
        </div>
      </div>
      {loading ? (
        <Spinner />
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No reviews yet.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map(review => (
            <li key={review.id} className="border rounded bg-white dark:bg-gray-800 p-3">
              <div className="flex justify-between items-center">
                {renderStars(review.rating)}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              {review.tags && review.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {review.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {review.feedback && (
                <p className="text-sm mt-2 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {review.feedback}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReviewList;
