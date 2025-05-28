import React, { useState } from 'react';
import { Input, Select, Button, FormSection, Label } from '../../ui';

const STRUCTURE_OPTIONS = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'single', label: 'Single Item' }
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' }
];

const CreateBoard = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [structure, setStructure] = useState('list');
  const [visibility, setVisibility] = useState('public');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState([]);

  const handleAddItem = () => {
    setItems([...items, { id: crypto.randomUUID(), title: '' }]);
  };

  const updateItem = (index, value) => {
    const updated = [...items];
    updated[index].title = value;
    setItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);

    const newBoard = {
      id: crypto.randomUUID(),
      title: title.trim(),
      structure,
      visibility,
      category: category.trim() || null,
      items: items.map((item) => ({ ...item }))
    };

    try {
      await onSave?.(newBoard);
    } catch (err) {
      console.error('[CreateBoard] Failed to create board:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Board Details">
        <Label htmlFor="board-title">Title</Label>
        <Input
          id="board-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Label htmlFor="board-structure">Structure</Label>
        <Select
          id="board-structure"
          value={structure}
          onChange={(e) => setStructure(e.target.value)}
          options={STRUCTURE_OPTIONS}
        />

        <Label htmlFor="board-visibility">Visibility</Label>
        <Select
          id="board-visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          options={VISIBILITY_OPTIONS}
        />

        <Label htmlFor="board-category">Category (Optional)</Label>
        <Input
          id="board-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </FormSection>

      <FormSection title="Add Items">
        {items.map((item, index) => (
          <Input
            key={item.id}
            value={item.title}
            onChange={(e) => updateItem(index, e.target.value)}
            placeholder={`Item ${index + 1}`}
          />
        ))}
        <Button type="button" variant="secondary" onClick={handleAddItem}>
          + Add Item
        </Button>
      </FormSection>

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
