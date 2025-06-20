import { axiosWithAuth } from '../utils/authUtils';
import type { Review, ReviewTargetType } from '../types/reviewTypes';

export interface FetchReviewsOptions {
  type?: ReviewTargetType;
  questId?: string;
  postId?: string;
  sort?: 'highest' | 'recent';
  search?: string;
}

export const fetchReviews = async (
  options: FetchReviewsOptions = {}
): Promise<Review[]> => {
  const params = new URLSearchParams();
  if (options.type) params.set('type', options.type);
  if (options.questId) params.set('questId', options.questId);
  if (options.postId) params.set('postId', options.postId);
  if (options.sort) params.set('sort', options.sort);
  if (options.search) params.set('search', options.search);

  const url = `/reviews${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await axiosWithAuth.get(url);
  return res.data;
};
