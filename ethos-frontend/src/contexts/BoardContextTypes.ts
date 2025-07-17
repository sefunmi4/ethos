import type { BoardData, BoardItem as BaseBoardItem } from '../types/boardTypes';
import type { GitFileNode, GitStatus } from '../types/gitTypes';

export type BoardItem = BaseBoardItem & {
  gitStatus?: GitStatus;
  fileTree?: GitFileNode[];
};

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
  expandedItemId: string | null;
  setExpandedItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

