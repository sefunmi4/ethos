import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addProject } from '../../api/project';
import { Button, Input, TextArea, Label, FormSection } from '../ui';
import type { Project } from '../../types/projectTypes';

interface CreateProjectProps {
  onSave?: (project: Project) => void;
  onCancel: () => void;
}

const CreateProject: React.FC<CreateProjectProps> = ({ onSave, onCancel }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      const project = await addProject(payload);
      onSave?.(project);
      navigate(`/project/${project.id}`);
    } catch (err) {
      console.error('[CreateProject] Failed to create project:', err);
      alert('Failed to create project');
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
          placeholder="Enter project title"
          required
        />
        <Label htmlFor="project-description">Description</Label>
        <TextArea
          id="project-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the project"
        />
        <Label htmlFor="project-tags">Tags</Label>
        <Input
          id="project-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="tag1, tag2"
        />
      </FormSection>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="contrast" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
};

export default CreateProject;
