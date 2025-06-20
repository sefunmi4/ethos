import { axiosWithAuth } from '../utils/authUtils';
import type { Quest, TaskEdge, EnrichedQuest } from '../types/questTypes';
import type { Post } from '../types/postTypes';
import { fetchPostById, fetchPostsByQuestId } from './post';

const BASE_URL = '/quests';

/**
 * @typedef CreateQuestPayload
 * @property {string} title - Quest title
 * @property {string=} description - Optional description
 * @property {string[]=} tags - Optional tags
 * @property {string=} repoUrl - Optional GitHub repo link
 * @property {string[]=} assignedRoles - Optional roles assigned at creation
 * @property {string=} fromPostId - Optional ID of post spawning the quest
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
 * Add a new quest  
 * @function addQuest  
 * @was createQuest  
 */
export const addQuest = async (data: CreateQuestPayload): Promise<Quest> => {
  const res = await axiosWithAuth.post(BASE_URL, data);
  return res.data;
};

/**
 * Fetch all quests  
 * @function fetchAllQuests  
 * @was getAllQuests  
 */
export const fetchAllQuests = async (): Promise<Quest[]> => {
  const res = await axiosWithAuth.get(BASE_URL);
  return res.data;
};

export const fetchFeaturedQuests = async (userId?: string): Promise<Quest[]> => {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  const url = `${BASE_URL}/featured${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await axiosWithAuth.get(url);
  return res.data;
};

export const fetchActiveQuests = async (userId?: string): Promise<Quest[]> => {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  const url = `${BASE_URL}/active${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await axiosWithAuth.get(url);
  return res.data;
};

/**
 * Update a quest by ID  
 * @function updateQuestById  
 * @was patchQuest  
 * @param id Quest ID
 * @param updates Partial fields to update
 */
export const updateQuestById = async (id: string, updates: Partial<Quest>): Promise<Quest> => {
  const res = await axiosWithAuth.patch(`${BASE_URL}/${id}`, updates);
  return res.data;
};

/**
 * Fetch a quest by ID  
 * @function fetchQuestById  
 * @was getQuestById  
 */
export const fetchQuestById = async (id: string): Promise<Quest> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${id}`);
  return res.data;
};

/**
 * Archive a quest (soft delete)  
 * @function archiveQuestById  
 */
export const archiveQuestById = async (id: string): Promise<{ success: boolean }> => {
  const res = await axiosWithAuth.post(`${BASE_URL}/${id}/archive`);
  return res.data;
};

/**
 * Remove a quest permanently  
 * @function removeQuestById  
 * @was deleteQuestById  
 */
export const removeQuestById = async (id: string): Promise<{ success: boolean }> => {
  const res = await axiosWithAuth.delete(`${BASE_URL}/${id}`);
  return res.data;
};

/**
 * Fetch graph data (nodes and edges) for a quest  
 * @function fetchQuestMapData  
 * @param questId Quest ID
 */
export const fetchQuestMapData = async (
  questId: string
): Promise<{ nodes: Post[]; edges: TaskEdge[] }> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${questId}/map`);
  return res.data;
};

/**
 * Link a post to a quest and optionally create a task edge.
 * @param questId The quest to update
 * @param data Link payload containing postId and edge info
 */
export const linkPostToQuest = async (
  questId: string,
  data: {
    postId: string;
    parentId?: string;
    edgeType?: 'sub_problem' | 'solution_branch' | 'folder_split';
    edgeLabel?: string;
    title?: string;
  }
): Promise<Quest> => {
  const res = await axiosWithAuth.post(`${BASE_URL}/${questId}/link`, data);
  return res.data;
};

/**
 * Fetch quests linked to a board  
 * @function fetchQuestsByBoardId  
 * @param boardId Board ID
 */
export const fetchQuestsByBoardId = async (
  boardId: string,
  userId?: string
): Promise<Quest[]> => {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  const res = await axiosWithAuth.get(
    `/boards/${boardId}/quests${params.toString() ? `?${params.toString()}` : ''}`
  );
  return res.data;
};

export const flagQuest = async (id: string): Promise<{ success: boolean; flags: number }> => {
  const res = await axiosWithAuth.post(`${BASE_URL}/${id}/flag`);
  return res.data;
};

export const moderateQuest = async (
  id: string,
  updates: { visibility?: Quest['visibility']; approvalStatus?: Quest['approvalStatus'] }
): Promise<Quest> => {
  const res = await axiosWithAuth.patch(`${BASE_URL}/${id}/moderate`, updates);
  return res.data;
};

/**
 * Enrich a quest with its posts, graph, and stats  
 * @function enrichQuestWithData  
 * @param quest The quest to enrich
 */
export const enrichQuestWithData = async (quest: Quest): Promise<EnrichedQuest> => {
  const [allPosts, mapData] = await Promise.all([
    fetchPostsByQuestId(quest.id),
    fetchQuestMapData(quest.id),
  ]);

  const logs = allPosts.filter(p => p.type === 'log');
  const tasks = allPosts.filter(p => p.type === 'task');
  const discussion = allPosts.filter(
    p => p.type === 'free_speech' || p.type === 'meta_system'
  );

  const completedTasks = tasks.filter(t => t.status === 'Done').length;
  const taskCount = tasks.length;

  const headPost = await fetchPostById(quest.headPostId);

  const linkedPostsResolved = (
    await Promise.all(
      quest.linkedPosts.map(async link =>
        link.itemType === 'post' ? await fetchPostById(link.itemId) : null
      )
    )
  ).filter(Boolean) as Post[];

  return {
    ...quest,
    headPost,
    linkedPostsResolved,
    logs,
    tasks,
    discussion,
    taskGraph: mapData.edges,
    completedTasks,
    taskCount,
    percentComplete: taskCount > 0 ? Math.floor((completedTasks / taskCount) * 100) : 0,
    isFeatured: false,
    isNew: false,
  };
};
