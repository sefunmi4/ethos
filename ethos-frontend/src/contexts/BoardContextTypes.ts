import type { BoardData } from '../types/boardTypes';
import type { GitFileNode, GitStatus } from '../types/gitTypes';

export interface BoardItem {
  id: string;
  gitStatus?: GitStatus;
  fileTree?: GitFileNode[];
  [key: string]: unknown;
}

export type BoardMap = Record<string, BoardData>;

export interface BoardContextType {
  boards: BoardMap;
  selectedBoard: string | null;
  setSelectedBoard: React.Dispatch<React.SetStateAction<string | null>>;
  loading: boolean;
  refreshBoards: () => Promise<void>;
  appendToBoard: (boardId: string, newItem: BoardItem) => void;
  updateBoardItem: (boardId: string, updatedItem: BoardItem) => void;
  removeItemFromBoard: (boardId: string, itemId: string) => void;
  setBoardMeta: (meta: { id: string; title: string; layout: string }) => void;
  updateBoardGitStatus: (boardId: string, status: GitStatus) => void;
  setBoardFileTree: (boardId: string, tree: GitFileNode[]) => void;
}

