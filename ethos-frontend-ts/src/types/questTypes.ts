import type { LinkedItem } from './postTypes';
import type { CollaberatorRoles } from './postTypes';


export interface Quest {
  id: string;
  authorId: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  headPostId: string;
  linkedPosts: LinkedItem[];
  collaborators: CollaberatorRoles[]; // ✅ Change this line
  repoUrl?: string;
  createdAt?: string;
  ownerId?: string;
  // 🆕 Optional additions
  tags?: string[];
}