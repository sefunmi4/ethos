// src/api/boards.ts
import { axiosWithAuth } from '../utils/authUtils';
import type { BoardData } from '../types/boardTypes';
import type { Post } from '../types/postTypes';
import type { Quest } from '../types/questTypes';
import type { BoardStructure, BoardType } from '../types/boardTypes';


const BASE_URL = '/api/boards';

export const fetchBoards = async (): Promise<BoardData[]> => {
  const res = await axiosWithAuth.get(BASE_URL);
  return res.data;
};

export const fetchBoardById = async (id: string): Promise<BoardData> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${id}`);
  return res.data;
};

export const fetchBoardItems = async (
  id: string
): Promise<(Post | Quest)[]> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${id}/items`);
  return res.data;
};

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
  const response = await axiosWithAuth.post('/boards', data);
  return response.data;
};

export const updateBoard = async (id: string, updates: Partial<BoardData>): Promise<BoardData> => {
  const res = await axiosWithAuth.patch(`${BASE_URL}/${id}`, updates);
  return res.data;
};

export const deleteBoard = async (id: string): Promise<{ success: boolean }> => {
  const res = await axiosWithAuth.delete(`${BASE_URL}/${id}`);
  return res.data;
};