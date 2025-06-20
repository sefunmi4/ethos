import React, { useState } from 'react';
import { Input, Select, TextArea, Button, Label, FormSection } from '../ui';
import {
  STRUCTURE_OPTIONS,
  VISIBILITY_OPTIONS,
  BOARD_TYPE_OPTIONS,
} from '../../constants/options';
import { updateBoard, removeBoard } from '../../api/board';
import type {
  BoardData,
  EditBoardProps,
  BoardLayout,
  BoardType,
} from '../../types/boardTypes';
import { getDisplayTitle } from '../../utils/displayUtils'; 

const EditBoard: React.FC<EditBoardProps> = ({ board, onSave, onCancel, onDelete }) => {
  const [title, setTitle] = useState(board.title || '');
  const [description, setDescription] = useState(board.description || '');
  const [layout, setStructure] = useState(board.layout || 'grid');
  const [boardType, setBoardType] = useState<BoardType>(board.boardType || 'post');
  const [visibility, setVisibility] = useState(board.filters?.visibility || 'public');
  const [category, setCategory] = useState(board.category || '');
  const [items, setItems] = useState<(string | null)[]>(board.items || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const enriched = board.enrichedItems || [];

  // Reorder list items (up/down)
  const handleReorder = (from: number, to: number) => {
    const updated = [...items];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload: Partial<BoardData> = {
      title: title.trim(),
      description: description.trim(),
      boardType,
      layout,
      items,
      filters: { visibility },
      category: category.trim() || undefined,
    };

    try {
      const updated = await updateBoard(board.id!, payload);
      onSave?.(updated);
    } catch (error) {
      console.error('[EditBoard] Failed to save board:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${board.title}"?`)) return;
    try {
      if (board.id) {
        await removeBoard(board.id);
        onDelete?.(board.id);
      }
    } catch (error) {
      console.error('[EditBoard] Failed to delete board:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Board Settings">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <Label htmlFor="description">Description</Label>
        <TextArea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Label htmlFor="layout">Structure</Label>
        <Select
          id="layout"
          value={layout}
          onChange={(e) => setStructure(e.target.value as BoardLayout)}
          options={STRUCTURE_OPTIONS.slice()}
        />

        <Label htmlFor="board-type">Board Type</Label>
        <Select
          id="board-type"
          value={boardType}
          onChange={(e) => setBoardType(e.target.value as BoardType)}
          options={BOARD_TYPE_OPTIONS.slice()}
        />

        <Label htmlFor="visibility">Visibility</Label>
        <Select
          id="visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          options={VISIBILITY_OPTIONS.slice()}
        />

        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Optional board grouping"
        />
      </FormSection>

      <FormSection title="Reorder Items">
        {items.length > 0 ? (
          <ul className="space-y-2">
            {items.map((itemId, i) => {
              const item = enriched.find((p) => p.id === itemId);
              const display = item
                ? getDisplayTitle(item)
                : itemId
                ? `Item ${i + 1}: ${itemId.slice(-6)}`
                : `Missing Item ${i + 1}`;

              return (
                <li key={itemId ?? `null-${i}`} className="flex justify-between items-center">
                  <span className="truncate max-w-xs">{display}</span>
                  <div className="flex gap-2">
                    {i > 0 && (
                      <Button type="button" onClick={() => handleReorder(i, i - 1)}>
                        ↑
                      </Button>
                    )}
                    {i < items.length - 1 && (
                      <Button type="button" onClick={() => handleReorder(i, i + 1)}>
                        ↓
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No items to reorder.</p>
        )}
      </FormSection>

      <div className="flex justify-between items-center pt-2">
        <Button type="button" variant="danger" onClick={handleDelete}>
          Delete Board
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default EditBoard;