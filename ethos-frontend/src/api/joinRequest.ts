import { axiosWithAuth } from '../utils/authUtils';
import type { JoinRequest } from '../types/joinRequestTypes';

const BASE_URL = '/join-requests';

export const createJoinRequest = async (
  taskId: string,
  requestPostId?: string,
): Promise<JoinRequest> => {
  const res = await axiosWithAuth.post(BASE_URL, { taskId, requestPostId });
  return res.data;
};

export const approveJoinRequest = async (id: string): Promise<JoinRequest> => {
  const res = await axiosWithAuth.patch(`${BASE_URL}/${id}/approve`);
  return res.data;
};

export const declineJoinRequest = async (id: string): Promise<JoinRequest> => {
  const res = await axiosWithAuth.patch(`${BASE_URL}/${id}/decline`);
  return res.data;
};

