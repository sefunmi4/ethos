import { axiosWithAuth } from '../utils/authUtils';
import type { Review } from '../types/reviewTypes';

const BASE_URL = '/reviews';

export const addReview = async (data: Partial<Review>): Promise<Review> => {
  const res = await axiosWithAuth.post(BASE_URL, data);
  return res.data;
};

export const updateReview = async (
  id: string,
  data: Partial<Review>
): Promise<Review> => {
  const res = await axiosWithAuth.patch(`${BASE_URL}/${id}`, data);
  return res.data;
};

export const fetchReviews = async (params: {
  type: string;
  questId?: string;
  postId?: string;
  sort?: string;
}): Promise<Review[]> => {
  const res = await axiosWithAuth.get(BASE_URL, { params });
  return res.data;
};

export interface ReviewSummary {
  averageRating: number;
  count: number;
  tagCounts: Record<string, number>;
}

export const fetchReviewSummary = async (
  entityType: string,
  id: string,
): Promise<ReviewSummary> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/summary/${entityType}/${id}`);
  return res.data;
};
