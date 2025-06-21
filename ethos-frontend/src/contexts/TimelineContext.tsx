// src/contexts/TimelineContext.tsx

import React, { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { TimelineEvent } from '../types/postTypes';
import { TimelineContext } from './TimelineContextBase';

/**
 * Context value type for managing timeline state.
 * Each board ID maps to a list of timeline events.
 */

/**
 * Props for the TimelineProvider component.
 */
interface TimelineProviderProps {
  children: ReactNode;
}

/**
 * Provides timeline state and mutation functions via React Context.
 * This allows components and hooks (e.g., useTimeline) to access or update
 * timeline events scoped to a board or user profile.
 */
export const TimelineProvider: React.FC<TimelineProviderProps> = ({ children }) => {
  const [timelines, setTimelines] = useState<Record<string, TimelineEvent[]>>({});

  /**
   * Updates the timeline events associated with a specific board ID.
   * This is useful for caching fetched timelines or appending new events.
   *
   * @param boardId - The ID of the board or user timeline
   * @param events - Array of timeline events
   */
  const setTimelineEvents = (boardId: string, events: TimelineEvent[]) => {
    setTimelines(prev => ({
      ...prev,
      [boardId]: events,
    }));
  };

  const value = useMemo(() => ({
    timelines,
    setTimelineEvents,
  }), [timelines]);

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
};
