import React, { useCallback, useEffect, useState } from 'react';
import { TAG_BASE } from '../constants/styles';
import { fetchReviews } from '../api/review';
import type { Review, ReviewTargetType } from '../types/reviewTypes';
import { Select, Spinner } from './ui';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import ReviewForm from './ReviewForm';

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
  const [editing, setEditing] = useState<Review | null>(null);
  const { user } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchReviews({ type, questId, postId, sort });
      setReviews(data || []);
    } catch (err) {
      console.error('[ReviewList] Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [type, questId, postId, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const renderStars = (count: number) => (
    <span className="text-yellow-500 flex">
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
            <li key={review.id} className="border rounded bg-surface dark:bg-background p-3">
              <div className="flex justify-between items-center">
                {renderStars(review.rating)}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
                {user?.id === review.reviewerId && (
                  <button
                    onClick={() => setEditing(review)}
                    className="text-xs text-accent underline ml-2"
                  >
                    Rewrite
                  </button>
                )}
              </div>
              {review.tags && review.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {Array.from(new Set(review.tags)).map((tag) => (
                    <span key={tag} className={TAG_BASE}>#{tag}</span>
                  ))}
                </div>
              )}
              {review.feedback && (
                <p className="text-sm mt-2 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {review.feedback}
                </p>
              )}
              {editing?.id === review.id && (
                <div className="mt-3">
                  <ReviewForm
                    reviewId={review.id}
                    targetType={review.targetType}
                    questId={review.questId}
                    postId={review.postId}
                    repoUrl={review.repoUrl}
                    modelId={review.modelId}
                    initialRating={review.rating}
                    initialTags={review.tags}
                    initialFeedback={review.feedback}
                    initialVisibility={review.visibility}
                    initialStatus={review.status}
                    onSubmitted={() => {
                      setEditing(null);
                      load();
                    }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReviewList;
