import React, { useState } from 'react';
import { Input, Select, Button, FormSection, Label, TextArea } from '../../ui';
import { axiosWithAuth } from '../../../utils/authUtils';

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
  const [description, setDescription] = useState('');
  const [structure, setStructure] = useState('grid');
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

    const boardData = {
      title: title.trim(),
      description: description.trim(),
      type: 'post', // default content type
      structure,
      items: items.map(item => ({ ...item })),
      filters: { visibility },
      featured: false,
      defaultFor: null,
    };

    try {
      const res = await axiosWithAuth.post('/boards', boardData);
      onSave?.(res.data);
    } catch (err) {
      console.error('[CreateBoard] Failed to create board:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Board Details">
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Label>Description</Label>
        <TextArea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this board’s purpose or theme"
          rows={3}
        />

        <Label>Structure</Label>
        <Select
          value={structure}
          onChange={(e) => setStructure(e.target.value)}
          options={STRUCTURE_OPTIONS}
        />

        <Label>Visibility</Label>
        <Select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          options={VISIBILITY_OPTIONS}
        />

        <Label>Category (Optional)</Label>
        <Input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Community, Planning, UX"
        />
      </FormSection>

      <FormSection title="Board Items">
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