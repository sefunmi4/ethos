import { useCallback, useContext } from 'react';
import { axiosWithAuth } from '../utils/authUtils';
import { TimelineEvent } from '../types/timelineTypes';
import { TimelineContext } from '../contexts/TimelineContext';

/**
 * Hook providing convenient methods for working with user or board timelines.
 * 
 * Exposes functions to:
 *  - Add a new event to a user's timeline
 *  - Load timeline events for a given board or user
 * 
 * Depends on `TimelineContext` for state management and caching support.
 */
export const useTimeline = () => {
  const context = useContext(TimelineContext);

  if (!context) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }

  const { setTimelineEvents } = context;

  /**
   * Adds a new event to the timeline.
   * Typically used to log system events, user actions, or quest progress.
   * 
   * @param event - A timeline event object
   */
  const addTimelineEvent = useCallback(async (event: TimelineEvent) => {
    try {
      await axiosWithAuth.post('/timeline', event);
    } catch (error) {
      console.error('[useTimeline] Failed to add timeline event:', error);
    }
  }, []);

  /**
   * Loads timeline events for a given board.
   * Automatically stores results in context for reuse.
   * 
   * @param boardId - ID of the board to load timeline for
   */
  const loadTimeline = useCallback(async (boardId: string) => {
    try {
      const res = await axiosWithAuth.get(`/timeline?boardId=${boardId}`);
      setTimelineEvents(boardId, res.data);
    } catch (error) {
      console.error('[useTimeline] Failed to load timeline for board:', error);
    }
  }, [setTimelineEvents]);

  return {
    addTimelineEvent,
    loadTimeline,
  };
};