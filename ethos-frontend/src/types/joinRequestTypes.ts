export type JoinRequestStatus = 'pending' | 'approved' | 'declined';

export interface JoinRequest {
  id: string;
  taskId: string;
  requesterId: string;
  status: JoinRequestStatus;
  requestPostId?: string;
  approverId?: string;
  createdAt: string;
  approvedAt?: string;
}

