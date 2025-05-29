import { useQuery } from '@tanstack/react-query';
import { axiosWithAuth } from '../utils/authUtils';

export const useBoard = (boardId) =>
  useQuery(['board', boardId], async () => {
    const res = await axiosWithAuth.get(`/boards/${boardId}?enrich=true`);
    return res.data;
  }, {
    enabled: !!boardId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });