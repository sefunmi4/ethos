import { useCallback } from 'react';
import type { Post, EnrichedPost } from '../types/postTypes';
import { fetchPostsByBoardId, enrichPostWithData } from '../api/post';

/**
 * Custom hook for handling post-related data logic.
 * 
 * Provides:
 * - fetchPostsForBoard: Retrieve posts from a board by ID
 * - enrichPosts: Augment posts with metadata (tags, linked quests, etc.)
 */
export const usePost = () => {
  /**
   * Fetch all posts associated with a given board.
   * 
   * @param boardId - Unique board identifier
   * @returns Promise resolving to an array of Post objects
   */
  const fetchPostsForBoard = useCallback(async (boardId: string): Promise<Post[]> => {
    try {
      const posts = await fetchPostsByBoardId(boardId);
      return posts;
    } catch (err) {
      console.error(`[usePost] Failed to fetch posts for board ${boardId}:`, err);
      return [];
    }
  }, []);

  /**
   * Enrich a list of raw posts with additional metadata.
   * 
   * @param posts - Array of raw Post objects
   * @returns Promise resolving to enriched post data
   */
  const enrichPosts = useCallback(async (posts: Post[]): Promise<EnrichedPost[]> => {
    try {
      const enriched = await Promise.all(posts.map((p) => enrichPostWithData(p)));
      return enriched;
    } catch (err) {
      console.error('[usePost] Failed to enrich posts:', err);
      return [];
    }
  }, []);

  return {
    fetchPostsForBoard,
    enrichPosts,
  };
};