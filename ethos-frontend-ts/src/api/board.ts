// src/api/board.ts

import { axiosWithAuth } from '../utils/authUtils';
import type { BoardData } from '../types/boardTypes';
import type { Post } from '../types/postTypes';
import type { Quest } from '../types/questTypes';
import type { BoardStructure, BoardType } from '../types/boardTypes';

const BASE_URL = '/api/boards';

/**
 * Fetch all available boards for the current user
 */
export const fetchBoards = async (): Promise<BoardData[]> => {
  const res = await axiosWithAuth.get(BASE_URL);
  return res.data;
};

/**
 * Fetch a single board by ID with optional query params
 */
export const fetchBoardById = async (
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
 * Fetch all items (posts or quests) associated with a board
 */
export const fetchBoardItems = async (id: string): Promise<(Post | Quest)[]> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${id}/items`);
  return res.data;
};

/**
 * Create a new board
 */
export const createBoard = async (data: {
  title: string;
  description: string;
  type: BoardType;
  structure: BoardStructure;
  items: string[];
  filters: Record<string, any>;
  featured: boolean;
  defaultFor: string | null;
  category?: string;
}) => {
  const response = await axiosWithAuth.post(BASE_URL, data);
  return response.data;
};

/**
 * Update an existing board by ID
 */
export const updateBoard = async (
  id: string,
  updates: Partial<BoardData>
): Promise<BoardData> => {
  const res = await axiosWithAuth.patch(`${BASE_URL}/${id}`, updates);
  return res.data;
};

/**
 * Delete a board by ID
 */
export const deleteBoard = async (id: string): Promise<{ success: boolean }> => {
  const res = await axiosWithAuth.delete(`${BASE_URL}/${id}`);
  return res.data;
};

/**
 * Remove a specific post or quest from a board
 */
export const removeFromBoard = async (
  boardId: string,
  itemId: string
): Promise<{ success: boolean }> => {
  const res = await axiosWithAuth.post(`${BASE_URL}/${boardId}/remove`, { itemId });
  return res.data;
};

/**
 * Fetch all boards that are marked as "featured"
 */
export const fetchFeaturedBoards = async (): Promise<BoardData[]> => {
  const res = await axiosWithAuth.get(`${BASE_URL}?featured=true`);
  return res.data;
};

/**
 * Fetch the default home feed board
 */
export const fetchDefaultHomeBoard = async (): Promise<BoardData | null> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/default/home`);
  return res.data || null;
};