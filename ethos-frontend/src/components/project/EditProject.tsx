import React, { useState } from 'react';
import type { Project } from '../../types/projectTypes';
import { updateProjectById } from '../../api/project';
import { Button, Label, TextArea, FormSection, Input } from '../ui';

interface EditProjectProps {
  project: Project;
  onCancel: () => void;
  onSave: (updated: Project) => void;
}

const EditProject: React.FC<EditProjectProps> = ({ project, onCancel, onSave }) => {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || '');
  const [tags, setTags] = useState((project.tags || []).join(', '));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updates: Partial<Project> = {
        title,
        description,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      const updated = await updateProjectById(project.id, updates);
      onSave(updated);
    } catch (err) {
      console.error('[EditProject] Failed to update:', err);
      alert('Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Project Details">
        <Label htmlFor="project-title">Title</Label>
        <Input
          id="project-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Label htmlFor="project-description">Description</Label>
        <TextArea
          id="project-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Label htmlFor="project-tags">Tags</Label>
        <Input
          id="project-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </FormSection>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default EditProject;
