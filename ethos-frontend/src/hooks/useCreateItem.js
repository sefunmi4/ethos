import { useBoardContext } from '../contexts/BoardContext';
import { v4 as uuidv4 } from 'uuid';

/**
 * useCreateItem - Hook to create and dispatch an item to the selected board.
 * Works with post, quest, project, etc., based on a shared Contribution schema.
 */
const useCreateItem = () => {
  const { selectedBoard, updateStructure, setSelectedBoard } = useBoardContext();

  const createItem = ({ type, content, title, metadata = {}, tags = [] }) => {
    if (!selectedBoard) {
      console.warn('[useCreateItem] No active board selected.');
      return;
    }

    // Basic Contribution Object
    const newItem = {
      id: uuidv4(),
      type,
      title: title || '',
      content: content || '',
      boardId: selectedBoard.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata,
      tags,
      reactions: [],
      comments: [],
    };

    // Dispatch to board
    const updatedBoard = {
      ...selectedBoard,
      items: [...(selectedBoard.items || []), newItem],
      updatedAt: new Date().toISOString(),
    };

    setSelectedBoard(updatedBoard);

    return newItem;
  };

  return { createItem };
};

export default useCreateItem;