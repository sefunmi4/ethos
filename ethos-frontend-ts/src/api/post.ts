// src/api/post.ts

import { axiosWithAuth } from '../utils/authUtils';
import type { Post } from '../types/postTypes';
import type { BoardData } from '../types/boardTypes';

const BASE_URL = '/api/posts';

/**
 * Fetch a single post by ID
 */
export const fetchPostById = async (id: string): Promise<Post> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${id}`);
  return res.data;
};

/**
 * Create a new post
 */
export const createPost = async (data: Partial<Post>): Promise<Post> => {
  const res = await axiosWithAuth.post(BASE_URL, data);
  return res.data;
};

/**
 * Update an existing post
 */
export const patchPost = async (id: string, updates: Partial<Post>): Promise<Post> => {
  const res = await axiosWithAuth.patch(`${BASE_URL}/${id}`, updates);
  return res.data;
};

/**
 * Fetch replies to a post as a board (paginated + enriched if needed)
 */
export const fetchReplyBoard = async (
  postId: string,
  options: { enrich?: boolean; page?: number } = {}
): Promise<BoardData> => {
  const params = new URLSearchParams();
  if (options.enrich) params.set('enrich', 'true');
  if (options.page) params.set('page', options.page.toString());

  const url = `/api/boards/thread/${postId}${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await axiosWithAuth.get(url);
  return res.data;
};

/**
 * Fetch raw replies (not board format)
 */
export const fetchRepliesByPostId = async (postId: string): Promise<Post[]> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${postId}/replies`);
  return res.data.replies || [];
};

/**
 * Fetch all posts linked to a quest
 */
export const fetchQuestPosts = async (questId: string): Promise<Post[]> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/quest/${questId}`);
  return res.data;
};

/**
 * Archive a post
 */
export const archivePostById = async (id: string): Promise<{ success: boolean }> => {
  const res = await axiosWithAuth.post(`${BASE_URL}/${id}/archive`);
  return res.data;
};

/**
 * Delete a post
 */
export const deletePostById = async (id: string): Promise<{ success: boolean }> => {
  const res = await axiosWithAuth.delete(`${BASE_URL}/${id}`);
  return res.data;
};

/**
 * Toggle a reaction on a post
 */
export const toggleReaction = async (
  postId: string,
  type: 'like' | 'heart',
  add: boolean
): Promise<{ success: boolean }> => {
  const method = add ? 'post' : 'delete';
  const url = `${BASE_URL}/${postId}/reactions/${type}`;
  const res = await axiosWithAuth[method](url);
  return res.data;
};

/**
 * Get all reactions for a post
 */
export const getReactions = async (postId: string): Promise<any[]> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${postId}/reactions`);
  return res.data;
};

/**
 * Get repost count for a post
 */
export const getRepostCount = async (postId: string): Promise<{ count: number }> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${postId}/reposts/count`);
  return res.data;
};

/**
 * Get current user's repost
 */
export const getUserRepost = async (postId: string): Promise<Post | null> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${postId}/reposts/user`);
  return res.data || null;
};

/**
 * Create a repost
 */
export const createRepost = async (post: Post): Promise<Post> => {
  const res = await axiosWithAuth.post(`${BASE_URL}/${post.id}/repost`, {});
  return res.data;
};