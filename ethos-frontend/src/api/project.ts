import { axiosWithAuth } from '../utils/authUtils';
import type { Project, ProjectEdge } from '../types/projectTypes';

const BASE_URL = '/projects';

export const addProject = async (data: Partial<Project>): Promise<Project> => {
  const res = await axiosWithAuth.post(BASE_URL, data);
  return res.data;
};

export const fetchAllProjects = async (): Promise<Project[]> => {
  const res = await axiosWithAuth.get(BASE_URL);
  return res.data;
};

export const fetchProjectById = async (id: string): Promise<Project> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${id}`);
  return res.data;
};

export const updateProjectById = async (
  id: string,
  updates: Partial<Project>,
): Promise<Project> => {
  const res = await axiosWithAuth.patch(`${BASE_URL}/${id}`, updates);
  return res.data;
};

export const removeProjectById = async (
  id: string,
): Promise<{ success: boolean }> => {
  const res = await axiosWithAuth.delete(`${BASE_URL}/${id}`);
  return res.data;
};

export const fetchProjectMap = async (
  id: string,
): Promise<{ edges: ProjectEdge[] }> => {
  const res = await axiosWithAuth.get(`${BASE_URL}/${id}/map`);
  return res.data;
};

export const updateProjectMap = async (
  id: string,
  edges: ProjectEdge[],
): Promise<{ success: boolean; edges: ProjectEdge[] }> => {
  const res = await axiosWithAuth.patch(`${BASE_URL}/${id}/map`, { edges });
  return res.data;
};
