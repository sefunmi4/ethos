import React, { useState } from 'react';
import {
  Input,
  Select,
  Button,
  FormSection,
  Label,
  TextArea,
} from '../ui';
import {
  STRUCTURE_OPTIONS,
  VISIBILITY_OPTIONS,
  BOARD_TYPE_OPTIONS,
} from '../../constants/options';
import type { BoardLayout, BoardType } from '../../types/boardTypes';
import { addBoard } from '../../api/board'; 

const CreateBoard: React.FC<{
  onSave?: (board: any) => void;
  onCancel?: () => void;
}> = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [layout, setStructure] = useState<BoardLayout>('grid');
  const [boardType, setBoardType] = useState<BoardType>('post');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<{ id: string; title: string }[]>([]);

  const handleAddItem = () => {
    setItems([...items, { id: crypto.randomUUID(), title: '' }]);
  };

  const updateItem = (index: number, value: string) => {
    const updated = [...items];
    updated[index].title = value;
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);

    const boardData = {
      title: title.trim(),
      description: description.trim(),
      boardType,
      layout,
      items: items.map(item => item.id),
      filters: { visibility },
      featured: false,
      defaultFor: null,
      category: category.trim() || undefined,
    };

    try {
      const newBoard = await addBoard(boardData); // ✅ Uses api/boards.ts
      onSave?.(newBoard);
    } catch (err) {
      console.error('[CreateBoard] Failed to create board:', err);
      alert('Failed to create board. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 📝 Board Info Section */}
      <FormSection title="Board Details">
        <Label>Title</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} required />

        <Label>Description</Label>
        <TextArea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe this board’s purpose or theme"
          rows={3}
        />

        <Label>Structure</Label>
        <Select
          value={layout}
          onChange={e => setStructure(e.target.value as BoardLayout)}
          options={STRUCTURE_OPTIONS.slice()}
        />

        <Label>Board Type</Label>
        <Select
          value={boardType}
          onChange={e => setBoardType(e.target.value as BoardType)}
          options={BOARD_TYPE_OPTIONS.slice()}
        />

        <Label>Visibility</Label>
        <Select
          value={visibility}
          onChange={e => setVisibility(e.target.value as 'public' | 'private')}
          options={VISIBILITY_OPTIONS.slice()}
        />

        <Label>Category (Optional)</Label>
        <Input
          value={category}
          onChange={e => setCategory(e.target.value)}
          placeholder="e.g. Community, Planning, UX"
        />
      </FormSection>

      {/* 🧩 Initial Items to Pre-fill Board */}
      <FormSection title="Initial Items">
        {items.map((item, index) => (
          <Input
            key={item.id}
            value={item.title}
            onChange={e => updateItem(index, e.target.value)}
            placeholder={`Item ${index + 1}`}
          />
        ))}
        <Button type="button" variant="contrast" onClick={handleAddItem}>
          + Add Item
        </Button>
      </FormSection>

      {/* ✅ Final Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Board'}
        </Button>
      </div>
    </form>
  );
};

export default CreateBoard;