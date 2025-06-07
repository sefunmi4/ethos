import { useCallback, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { getBoardPermissions } from '../api/board'; // TODO: odule '"../api/board"' has no exported member 'getBoardPermissions'.ts

interface BoardPermission {
  boardId: string;
  canView: boolean;
  canEdit?: boolean;
  roles?: string[];
}

type PermissionCache = Record<string, BoardPermission>;

interface UsePermissions {
  hasAccessToBoard: (boardId: string) => boolean;
  loadPermissions: (boardId: string) => Promise<BoardPermission | null>;
  canEditBoard: (boardId: string) => boolean;
}

export const usePermissions = (): UsePermissions => {
  const { user } = useContext(AuthContext);
  const permissionCache = useRef<PermissionCache>({});

  const hasAccessToBoard = useCallback((boardId: string): boolean => {
    const cached = permissionCache.current[boardId];
    return !!cached?.canView;
  }, []);

  const canEditBoard = useCallback((boardId: string): boolean => {
    const permission = permissionCache.current[boardId];
    return !!permission?.canEdit;
  }, []);

  const loadPermissions = useCallback(async (boardId: string): Promise<BoardPermission | null> => {
    if (!user?.id || !boardId) return null;

    try {
      const permission = await getBoardPermissions(boardId);
      permissionCache.current[boardId] = permission;
      return permission;
    } catch (err) {
      console.warn(`[Permissions] Failed to load for board ${boardId}`, err);
      return null;
    }
  }, [user?.id]);

  return { hasAccessToBoard, loadPermissions, canEditBoard };
};
