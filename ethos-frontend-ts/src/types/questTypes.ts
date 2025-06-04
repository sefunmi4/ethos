export interface Quest {
  id: string;
  authorId: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  headPostId: string;
  linkedPostIds: { itemId: string; itemType: string; nodeId?: string }[];
  collaborators: string[];
  repoUrl?: string;
  createdAt?: string;
  ownerId?: string;
  // 🆕 Optional additions
  tags?: string[];
  roles?: { role: string; assignedTo: string }[]; // or however you're modeling roles
}