export interface Notification {
  id: string;
  userId: string;
  message: string;
  link?: string;
  read?: boolean;
  createdAt: string;
}
