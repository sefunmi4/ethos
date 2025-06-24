import type { Visibility } from './common';
import type { Quest } from './questTypes';
import type { Post } from './postTypes';

export interface ProjectEdge {
  from: string;
  to: string;
  type?: 'sub_project' | 'dependency';
  label?: string;
}

export interface Project {
  id: string;
  authorId: string;
  title: string;
  description?: string;
  visibility: Visibility;
  status: 'active' | 'completed' | 'archived';
  tags?: string[];
  createdAt?: string;
  quests: string[];
  deliverables: string[];
  mapEdges?: ProjectEdge[];
  collaborators?: { userId?: string; roles?: string[]; pending?: string[] }[];
}

export interface EnrichedProject extends Project {
  questsResolved?: Quest[];
  deliverablesResolved?: Post[];
}
