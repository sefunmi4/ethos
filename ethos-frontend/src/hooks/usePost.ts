import { useCallback } from 'react';
import type { Post, EnrichedPost } from '../types/postTypes';
import {
  fetchPostsByBoardId,
  enrichPostWithData,
  solvePost,
  getPropagationStatus,
} from '../api/post';

/**
 * Custom hook for handling post-related data logic.
 * 
 * Provides:
 * - fetchPostsForBoard: Retrieve posts from a board by ID
 * - enrichPosts: Augment posts with metadata (tags, linked quests, etc.)
 * - markAsSolved: Mark a post as solved
 * - propagateSolution: Check and handle solution propagation
 */
export const usePost = () => {
  const fetchPostsForBoard = useCallback(async (boardId: string, userId?: string): Promise<Post[]> => {
    try {
        const posts = await fetchPostsByBoardId(boardId, userId);
      return posts;
    } catch (err) {
      console.error(`[usePost] Failed to fetch posts for board ${boardId}:`, err);
      return [];
    }
  }, []);

  const enrichPosts = useCallback(async (posts: Post[]): Promise<EnrichedPost[]> => {
    try {
      const enriched = await Promise.all(posts.map((p) => enrichPostWithData(p.id)));
      return enriched;
    } catch (err) {
      console.error('[usePost] Failed to enrich posts:', err);
      return [];
    }
  }, []);

  const markAsSolved = useCallback(async (postId: string): Promise<boolean> => {
    try {
      const res = await solvePost(postId);
      return res.success;
    } catch (err) {
      console.error(`[usePost] Failed to mark post ${postId} as solved:`, err);
      return false;
    }
  }, []);

  const propagateSolution = useCallback(async (postId: string) => {
    try {
      const res = await getPropagationStatus(postId);
      return res;
    } catch (err) {
      console.error(`[usePost] Failed to check propagation for ${postId}:`, err);
      return { cascadeCompleted: false, affectedIds: [] };
    }
  }, []);

  return {
    fetchPostsForBoard,
    enrichPosts,
    markAsSolved,
    propagateSolution,
  };
};