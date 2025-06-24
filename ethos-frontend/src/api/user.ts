import { axiosWithAuth } from '../utils/authUtils';

export const followUser = async (id: string) => {
  const res = await axiosWithAuth.post(`/users/${id}/follow`);
  return res.data;
};

export const unfollowUser = async (id: string) => {
  const res = await axiosWithAuth.post(`/users/${id}/unfollow`);
  return res.data;
};
