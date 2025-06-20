export type ReviewTargetType = 'ai_app' | 'quest' | 'creator' | 'dataset';

export interface Review {
  id: string;
  reviewerId: string;
  targetType: ReviewTargetType;
  rating: number;
  tags?: string[];
  feedback?: string;
  repoUrl?: string;
  modelId?: string;
  questId?: string;
  postId?: string;
  createdAt: string;
}
