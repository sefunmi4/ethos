// src/api/board.ts

import { axiosWithAuth } from '../utils/authUtils';
import type { BoardData, CreateBoardPayload } from '../types/boardTypes';
import { DEFAULT_PAGE_SIZE } from '../constants/pagination';
import type { Post } from '../types/postTypes';
import type { Quest } from '../types/questTypes';

const BASE_URL = '/boards';

/**
 * 🧠 fetchBoards → Get all boards (optionally filtered by user)
 * @param userId Optional user ID to fetch personal boards
 */
export const fetchBoards = async (
  options?: { userId?: string; enrich?: boolean }
): Promise<BoardData[]> => {
  const params = new URLSearchParams();
  if (options?.userId) params.set('userId', options.userId);
  if (options?.enrich) params.set('enrich', 'true');
  const url = `${BASE_URL}${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await axiosWithAuth.get(url);
  return res.data;
};

/**
 * 🧠 fetchBoard → Get a single board with optional enrichment
 * @param id Board ID
 * @param options Optional { enrich?: boolean; page?: number; limit?: number }
 */
export const fetchBoard = async (
  id: string,
  options: { enrich?: boolean; page?: number; limit?: number; userId?: string } = {}
): Promise<BoardData> => {
  const params = new URLSearchParams();
  if (options.enrich) params.set('enrich', 'true');
  if (options.page) params.set('page', options.page.toString());
  if (options.userId) params.set('userId', options.userId);
  params.set('limit', (options.limit ?? DEFAULT_PAGE_SIZE).toString());
  const url = `${BASE_URL}/${id}${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await axiosWithAuth.get(url);
  return res.data;
};

/**
 * 🧠 fetchBoardItems → Get items (posts/quests) in a board
 * @param id Board ID
 */
export const fetchBoardItems = async (
  id: string,
  options: { enrich?: boolean; userId?: string } = {}
): Promise<(Post | Quest)[]> => {
  const params = new URLSearchParams();
  if (options.enrich) params.set('enrich', 'true');
  if (options.userId) params.set('userId', options.userId);
  const url = `${BASE_URL}/${id}/items${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await axiosWithAuth.get(url);
  return res.data;
};

/**
 * ➕ addBoard → Create a new board
 * @param data Object containing board fields (title, type, layout, etc)
 */
export const addBoard = async (
  data: CreateBoardPayload
): Promise<BoardData> => {
  const res = await axiosWithAuth.post(BASE_URL, data);
  return res.data;
};

/**
 * 🔁 updateBoard → Modify existing board fields
 * @param id Board ID
 * @param updates Partial update object
 */
export const updateBoard = async (
  id: string,
  updates: Partial<BoardData>
): Promise<BoardData> => {
  const res = await axiosWithAuth.patch(`${BASE_URL}/${id}`, updates);
  return res.data;
};

/**
 * Fetch permissions for a board
 */
export const getBoardPermissions = async (
  id: string
): Promise<{ boardId: string; canView: boolean; canEdit?: boolean }> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${id}/permissions`);
  return res.data;
};

/**
 * @param id Board ID
 */
export const removeBoard = async (id: string): Promise<{ success: boolean }> => {
  const res = await axiosWithAuth.delete(`${BASE_URL}/${id}`);
  return res.data;
};

/**
 * @param boardId ID of the board
 * @param itemId ID of the item to remove
 */
export const removeItemFromBoard = async (
  boardId: string,
  itemId: string
): Promise<{ success: boolean }> => {
  const res = await axiosWithAuth.post(`${BASE_URL}/${boardId}/remove`, { itemId });
  return res.data;
};

/**
 * 🧠 fetchFeaturedBoards → Get all boards marked as featured
 */
export const fetchFeaturedBoards = async (): Promise<BoardData[]> => {
  const res = await axiosWithAuth.get(`${BASE_URL}?featured=true`);
  return res.data;
};

/**
 * 🧠 fetchDefaultHomeBoard → Get the default home board config (if set)
 */
export const fetchDefaultHomeBoard = async (): Promise<BoardData | null> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/default/home`);
  return res.data || null;
};
