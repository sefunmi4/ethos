import React, { useState } from 'react';
import { Input, Select, Button, TextArea, FormSection, Label } from '../ui';
import { axiosWithAuth } from '../../utils/authUtils';

const STRUCTURE_OPTIONS = [
  { value: 'grid', label: 'Grid' },
  { value: 'list', label: 'List' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'single', label: 'Single Item' }
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' }
];

const EditBoard = ({ board, onSave, onCancel, onDelete }) => {
  const [title, setTitle] = useState(board.title || '');
  const [description, setDescription] = useState(board.description || '');
  const [structure, setStructure] = useState(board.structure || 'grid');
  const [visibility, setVisibility] = useState(board.filters?.visibility || 'public');
  const [category, setCategory] = useState(board.category || '');
  const [items, setItems] = useState(board.items || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReorder = (fromIndex, toIndex) => {
    const updated = [...items];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        structure,
        items,
        filters: { visibility },
        category: category.trim() || undefined
      };
      await axiosWithAuth.patch(`/boards/${board.id}`, payload);
      onSave?.({ ...board, ...payload });
    } catch (err) {
      console.error('[EditBoard] Failed to update board:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this board?')) return;
    try {
      await axiosWithAuth.delete(`/boards/${board.id}`);
      onDelete?.(board.id);
    } catch (err) {
      console.error('[EditBoard] Failed to delete board:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Board Details">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <Label htmlFor="description">Description</Label>
        <TextArea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this board about?"
          rows={3}
        />

        <Label htmlFor="structure">Structure</Label>
        <Select
          id="structure"
          value={structure}
          onChange={(e) => setStructure(e.target.value)}
          options={STRUCTURE_OPTIONS}
        />

        <Label htmlFor="visibility">Visibility</Label>
        <Select
          id="visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          options={VISIBILITY_OPTIONS}
        />

        <Label htmlFor="category">Category</Label>
        <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
      </FormSection>

      <FormSection title="Reorder Items">
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={item.id} className="flex justify-between items-center">
              <span>{item.title || `Item ${index + 1}`}</span>
              <div className="flex gap-2">
                {index > 0 && (
                  <Button type="button" onClick={() => handleReorder(index, index - 1)}>
                    ↑
                  </Button>
                )}
                {index < items.length - 1 && (
                  <Button type="button" onClick={() => handleReorder(index, index + 1)}>
                    ↓
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </FormSection>

      <div className="flex justify-between items-center">
        <Button type="button" variant="danger" onClick={handleDelete}>
          Delete Board
        </Button>
        <div className="flex gap-3">
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