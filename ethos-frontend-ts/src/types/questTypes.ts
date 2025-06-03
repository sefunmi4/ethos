export interface Quest {
  id: string;
  authorId: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  headPostId: string;
  linkedPostIds: string[];
  collaborators: string[];
}