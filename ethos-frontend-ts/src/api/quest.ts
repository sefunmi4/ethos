import { axiosWithAuth } from '../utils/authUtils';
import type { Quest } from '../types/questTypes';

/**
 * Base endpoint for quest-related API calls
 */
const BASE_URL = '/api/quests';

/**
 * Payload type for creating a new quest
 */
export interface CreateQuestPayload {
  title: string;
  description?: string;
  tags?: string[];
  repoUrl?: string;
  assignedRoles?: string[];
  fromPostId?: string;
}

/**
 * Create a new quest
 * @param data Quest creation payload
 * @returns Newly created Quest object
 */
export const createQuest = async (data: CreateQuestPayload): Promise<Quest> => {
  const res = await axiosWithAuth.post(BASE_URL, data);
  return res.data;
};

/**
 * Update an existing quest
 * @param id Quest ID to update
 * @param updates Partial updates to the quest
 * @returns Updated Quest object
 */
export const patchQuest = async (id: string, updates: Partial<Quest>): Promise<Quest> => {
  const res = await axiosWithAuth.patch(`${BASE_URL}/${id}`, updates);
  return res.data;
};

/**
 * Get a quest by its ID
 * @param id Quest ID
 * @returns Full Quest object
 */
export const getQuestById = async (id: string): Promise<Quest> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${id}`);
  return res.data;
};

/**
 * Archive a quest (soft delete)
 * @param id Quest ID
 * @returns Success confirmation
 */
export const archiveQuestById = async (id: string): Promise<{ success: boolean }> => {
  const res = await axiosWithAuth.post(`${BASE_URL}/${id}/archive`);
  return res.data;
};

/**
 * Permanently delete a quest
 * @param id Quest ID
 * @returns Success confirmation
 */
export const deleteQuestById = async (id: string): Promise<{ success: boolean }> => {
  const res = await axiosWithAuth.delete(`${BASE_URL}/${id}`);
  return res.data;
};