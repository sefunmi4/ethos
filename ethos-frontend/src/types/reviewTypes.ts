export type ReviewTargetType =
  | 'ai_app'
  | 'quest'
  | 'creator'
  | 'dataset'
  | 'user'
  | 'party'
  | 'guild'
  | 'company'
  | 'product'
  | 'request'
  | 'task';

export interface Review {
  id: string;
  reviewerId: string;
  targetType: ReviewTargetType;
  rating: number;
  visibility: 'private' | 'public';
  status: 'draft' | 'submitted' | 'accepted';
  tags?: string[];
  feedback?: string;
  repoUrl?: string;
  modelId?: string;
  questId?: string;
  postId?: string;
  createdAt: string;
}
