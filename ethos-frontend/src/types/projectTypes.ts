
import type { Quest, TaskEdge } from './questTypes';

// Alias the quest task edge type for project maps
export type ProjectEdge = TaskEdge;

export interface Project extends Quest {
  questIds: string[];
  deliverables?: string[];
  mapEdges?: ProjectEdge[];
}
