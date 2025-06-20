import { axiosWithAuth } from '../utils/authUtils';
import type { Review } from '../types/reviewTypes';

const BASE_URL = '/reviews';

export const addReview = async (data: Partial<Review>): Promise<Review> => {
  const res = await axiosWithAuth.post(BASE_URL, data);
  return res.data;
};
