import { axiosWithAuth } from '../utils/authUtils';
import type { Notification } from '../types/notificationTypes';

export const fetchNotifications = async (): Promise<Notification[]> => {
  const res = await axiosWithAuth.get('/notifications');
  return res.data;
};

export const markNotificationRead = async (id: string): Promise<Notification> => {
  const res = await axiosWithAuth.patch(`/notifications/${id}/read`);
  return res.data;
};
