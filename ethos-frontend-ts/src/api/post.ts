import { axiosWithAuth } from '../utils/authUtils';
import type { Post } from '../types/postTypes';

/**
 * Base endpoint for post-related API calls
 */
const BASE_URL = '/api/posts';

/**
 * Create a new post
 * @param data Partial<Post> containing required and optional post fields
 * @returns Newly created post object
 */
export const createPost = async (data: Partial<Post>): Promise<Post> => {
  const res = await axiosWithAuth.post(BASE_URL, data);
  return res.data;
};

/**
 * Update an existing post
 * @param id ID of the post to update
 * @param updates Partial<Post> object with updated fields
 * @returns Updated post object
 */
export const patchPost = async (id: string, updates: Partial<Post>): Promise<Post> => {
  const res = await axiosWithAuth.patch(`${BASE_URL}/${id}`, updates);
  return res.data;
};

/**
 * Fetch replies to a given post
 * @param postId ID of the parent post
 * @returns Array of posts that are replies
 */
export const fetchRepliesByPostId = async (postId: string): Promise<Post[]> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${postId}/replies`);
  return res.data.replies || [];
};

/**
 * Fetch all posts associated with a specific quest
 * @param questId ID of the quest
 * @returns Array of posts linked to the quest
 */
export const fetchQuestPosts = async (questId: string): Promise<Post[]> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/quest/${questId}`);
  return res.data;
};

/**
 * Archive a post
 * @param id ID of the post to archive
 * @returns Success confirmation
 */
export const archivePostById = async (id: string): Promise<{ success: boolean }> => {
  const res = await axiosWithAuth.post(`${BASE_URL}/${id}/archive`);
  return res.data;
};

/**
 * Permanently delete a post
 * @param id ID of the post to delete
 * @returns Success confirmation
 */
export const deletePostById = async (id: string): Promise<{ success: boolean }> => {
  const res = await axiosWithAuth.delete(`${BASE_URL}/${id}`);
  return res.data;
};

/**
 * Toggle a reaction (like or heart) on a post
 * @param postId ID of the post
 * @param type Reaction type ('like' | 'heart')
 * @param add Whether to add or remove the reaction
 * @returns Success confirmation
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
 * @param postId ID of the post
 * @returns List of reactions
 */
export const getReactions = async (postId: string): Promise<any[]> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${postId}/reactions`);
  return res.data;
};

/**
 * Get repost count for a post
 * @param postId ID of the post
 * @returns Count object
 */
export const getRepostCount = async (postId: string): Promise<{ count: number }> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${postId}/reposts/count`);
  return res.data;
};

/**
 * Get current user's repost of a post
 * @param postId ID of the post
 * @returns Repost object or null
 */
export const getUserRepost = async (postId: string): Promise<Post | null> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${postId}/reposts/user`);
  return res.data || null;
};

/**
 * Create a repost of a post
 * @param post Post object to repost
 * @returns Newly created repost object
 */
export const createRepost = async (post: Post): Promise<Post> => {
  const res = await axiosWithAuth.post(`${BASE_URL}/${post.id}/repost`, {});
  return res.data;
};
