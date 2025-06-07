// src/api/board.ts

import { axiosWithAuth } from '../utils/authUtils';
import type { BoardData } from '../types/boardTypes';
import type { Post } from '../types/postTypes';
import type { Quest } from '../types/questTypes';
import type { BoardLayout } from '../types/boardTypes';

const BASE_URL = '/api/boards';

/**
 * 🧠 fetchBoards → Get all boards (optionally filtered by user)
 * @param userId Optional user ID to fetch personal boards
 */
export const fetchBoards = async (userId?: string): Promise<BoardData[]> => {
  const url = userId ? `${BASE_URL}?userId=${userId}` : BASE_URL;
  const res = await axiosWithAuth.get(url);
  return res.data;
};

/**
 * 🧠 fetchBoard → Get a single board with optional enrichment
 * @param id Board ID
 * @param options Optional { enrich?: boolean; page?: number }
 */
export const fetchBoard = async (
  id: string,
  options: { enrich?: boolean; page?: number } = {}
): Promise<BoardData> => {
  const params = new URLSearchParams();
  if (options.enrich) params.set('enrich', 'true');
  if (options.page) params.set('page', options.page.toString());
  const url = `${BASE_URL}/${id}${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await axiosWithAuth.get(url);
  return res.data;
};

/**
 * 🧠 fetchBoardItems → Get items (posts/quests) in a board
 * @param id Board ID
 */
export const fetchBoardItems = async (id: string): Promise<(Post | Quest)[]> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${id}/items`);
  return res.data;
};

/**
 * ➕ addBoard → Create a new board
 * @param data Object containing board fields (title, type, layout, etc)
 */
export const addBoard = async (data: { // TODO: Addboard doesnt match baord type 
  title: string;
  description: string;
  layout: BoardLayout;
  items: string[];
  filters: Record<string, any>;
  featured: boolean;
  defaultFor: string | null;
  category?: string;
}): Promise<BoardData> => {
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
