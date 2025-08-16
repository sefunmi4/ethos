export interface Notification {
  id: string;
  userId: string;
  message: string;
  link?: string;
  read?: boolean;
  createdAt: string;
  /** Optional join request identifier if this notification is about a request to join */
  joinRequestId?: string;
  /** Task or post identifier related to the join request */
  taskId?: string;
}
