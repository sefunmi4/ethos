// src/api/post.ts

import { axiosWithAuth } from '../utils/authUtils';
import type { Post } from '../types/postTypes';
import type { BoardData } from '../types/boardTypes';

const BASE_URL = '/posts';

/**
 * 🔍 Fetch a single post by ID
 * @param id - Post ID
 */
export const fetchPostById = async (id: string): Promise<Post> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${id}`);
  return res.data;
};

/**
 * 📃 Fetch all posts
 */
export const fetchAllPosts = async (): Promise<Post[]> => {
  const res = await axiosWithAuth.get(BASE_URL);
  return res.data;
};

/**
 * ➕ Add a new post
 * @param data - Partial post data
 */
export const addPost = async (data: Partial<Post>): Promise<Post> => {
  const res = await axiosWithAuth.post(BASE_URL, data);
  return res.data;
};

// renamed from patchPost → updatePost
/**
 * 🛠 Update an existing post
 * @param id - Post ID
 * @param updates - Partial update object
 */
export const updatePost = async (id: string, updates: Partial<Post>): Promise<Post> => {
  const res = await axiosWithAuth.patch(`${BASE_URL}/${id}`, updates);
  return res.data;
};

/**
 * 🔃 Fetch replies to a post as a board
 * @param postId - Post ID
 * @param options - Enrichment or pagination settings
 */
export const fetchReplyBoard = async (
  postId: string,
  options: { enrich?: boolean; page?: number; limit?: number } = {}
): Promise<BoardData> => {
  const params = new URLSearchParams();
  if (options.enrich) params.set('enrich', 'true');
  if (options.page) params.set('page', options.page.toString());
  if (options.limit) params.set('limit', options.limit.toString());

  const url = `/boards/thread/${postId}${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await axiosWithAuth.get(url);
  return res.data;
};

/**
 * 📄 Fetch raw replies by post ID
 * @param postId - Parent post ID
 */
export const fetchRepliesByPostId = async (postId: string): Promise<Post[]> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${postId}/replies`);
  return res.data.replies || [];
};

/**
 * 📌 Fetch posts linked to a specific quest
 * @param questId - Quest ID
 */
export const fetchPostsByQuestId = async (questId: string): Promise<Post[]> => {
  const res = await axiosWithAuth.get(`/quests/${questId}/posts`);
  return res.data;
};

/**
 * 📌 Fetch posts by board ID
 * @param boardId - Board ID
 */
export const fetchPostsByBoardId = async (
  boardId: string,
  userId?: string
): Promise<Post[]> => {
  const params = new URLSearchParams();
  params.set('enrich', 'true');
  if (userId) params.set('userId', userId);
  const res = await axiosWithAuth.get(
    `/boards/${boardId}/items?${params.toString()}`
  );
  return (res.data || []).filter((item: any) => 'content' in item);
};

/**
 * 🗃 Archive a post by ID
 * @param id - Post ID
 */
export const archivePost = async (id: string): Promise<{ success: boolean }> => {
  const res = await axiosWithAuth.post(`${BASE_URL}/${id}/archive`);
  return res.data;
};

/**
 * ❌ Remove a post by ID
 * @param id - Post ID
 */
export const removePost = async (id: string): Promise<{ success: boolean }> => {
  const res = await axiosWithAuth.delete(`${BASE_URL}/${id}`);
  return res.data;
};

/**
 * ❤️ Toggle a reaction (like/heart)
 * @param postId - Post ID
 * @param type - Reaction type
 * @param add - Whether to add or remove
 */
export const updateReaction = async (
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
 * 🔁 Fetch all reactions on a post
 * @param postId - Post ID
 */
export const fetchReactions = async (postId: string): Promise<any[]> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${postId}/reactions`);
  return res.data;
};

/**
 * 🔁 Fetch repost count for a post
 * @param postId - Post ID
 */
export const fetchRepostCount = async (postId: string): Promise<{ count: number }> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${postId}/reposts/count`);
  return res.data;
};

/**
 * 🔁 Fetch current user's repost of a post
 * @param postId - Post ID
 */
export const fetchUserRepost = async (postId: string): Promise<Post | null> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${postId}/reposts/user`);
  return res.data || null;
};

/**
 * 🔁 Add a repost for a post
 * @param post - Original post object
 */
export const addRepost = async (post: Post): Promise<Post> => {
  const res = await axiosWithAuth.post(`${BASE_URL}/${post.id}/repost`, {});
  return res.data;
};

/**
 * ❌ Remove a repost by ID
 * @param postId - Repost Post ID
 */
export const removeRepost = async (
  postId: string
): Promise<{ success: boolean }> => {
  return removePost(postId);
};

/**
 * 🧪 (Utility) Enrich a post client-side
 * @param post - Raw post object
 */
export const enrichPostWithData = async (post: Post): Promise<Post> => {
  return {
    ...post,
    enriched: true,
  };
};

/**
 * ✅ Solve a post (e.g. mark it and propagate solution)
 * @param postId - Post ID
 */
export const solvePost = async (postId: string): Promise<{ success: boolean }> => {
  const res = await axiosWithAuth.post(`${BASE_URL}/${postId}/solve`);
  return res.data;
};

/**
 * 🔗 Get all posts linked to a post (e.g. solutions, duplicates, references)
 * @param postId - Post ID
 */
export const getLinkedPosts = async (postId: string): Promise<Post[]> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${postId}/linked`);
  return res.data.posts || [];
};

/**
 * 🌐 Check propagation status (e.g. of a solution or link cascade)
 * @param postId - Post ID
 */
export const getPropagationStatus = async (
  postId: string
): Promise<{ cascadeCompleted: boolean; affectedIds: string[] }> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${postId}/propagation-status`);
  return res.data;
};