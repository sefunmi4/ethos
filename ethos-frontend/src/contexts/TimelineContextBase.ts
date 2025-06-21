import { createContext } from 'react';
import type { TimelineEvent } from '../types/postTypes';

interface TimelineContextValue {
  timelines: Record<string, TimelineEvent[]>;
  setTimelineEvents: (boardId: string, events: TimelineEvent[]) => void;
}

export const TimelineContext = createContext<TimelineContextValue | undefined>(undefined);
export type { TimelineContextValue };
