import { useCallback, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext'; // assumes user context exists
import { axiosWithAuth } from '../utils/authUtils';

/**
 * Represents the shape of permission data for a board.
 */
interface BoardPermission {
  boardId: string;
  canView: boolean;
  canEdit?: boolean;
  roles?: string[]; // Optional roles for future extension
}

/**
 * Internal cache map to store permissions per board.
 * Prevents redundant network calls.
 */
type PermissionCache = Record<string, BoardPermission>;

interface UsePermissions {
  hasAccessToBoard: (boardId: string) => boolean;
  loadPermissions: (boardId: string) => Promise<BoardPermission | null>;
  canEditBoard: (boardId: string) => boolean;
}

/**
 * Custom React hook to manage board-level permissions for the current user.
 * Provides utilities to check access and load permission data.
 */
export const usePermissions = (): UsePermissions => {
  const { user } = useContext(AuthContext);
  const permissionCache = useRef<PermissionCache>({});

  /**
   * Checks if the current user has view access to the specified board.
   * Falls back to cached permissions if available.
   *
   * @param boardId - The ID of the board to check access for
   * @returns true if the user can view the board
   */
  const hasAccessToBoard = useCallback((boardId: string): boolean => {
    const cached = permissionCache.current[boardId];
    return !!cached?.canView;
  }, []);

  const canEditBoard = useCallback((boardId: string): boolean => {
    const permission = permissionCache.current[boardId];
    return !!permission?.canEdit;
  }, []);

  /**
   * Loads and caches permissions for the specified board.
   * Should be called after login or board selection.
   *
   * @param boardId - The ID of the board to fetch permissions for
   * @returns The BoardPermission object or null on failure
   */
  const loadPermissions = useCallback(async (boardId: string): Promise<BoardPermission | null> => {
    if (!user?.id || !boardId) return null;

    try {
      const res = await axiosWithAuth.get<BoardPermission>(`/permissions/board/${boardId}`);
      const permission = res.data;
      permissionCache.current[boardId] = permission;
      return permission;
    } catch (err) {
      console.warn(`[Permissions] Failed to load for board ${boardId}`, err);
      return null;
    }
  }, [user?.id]);

  return { hasAccessToBoard, loadPermissions, canEditBoard };
};