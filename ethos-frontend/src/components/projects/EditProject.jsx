import React, { useState } from 'react';
import EditQuest from '../quests/EditQuest';
import { FormSection, Button, Label, Input, TextArea } from '../ui';

const EditProject = ({ project = {}, onSave, onCancel }) => {
  const [title, setTitle] = useState(project.title || '');
  const [description, setDescription] = useState(project.description || '');
  const [timeline, setTimeline] = useState(project.timeline || []);
  const [stages, setStages] = useState(project.stages || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTimelineChange = (index, field, value) => {
    const updated = [...timeline];
    updated[index][field] = value;
    setTimeline(updated);
  };

  const handleAddStage = () => {
    setStages([...stages, { id: crypto.randomUUID(), name: '', description: '' }]);
  };

  const handleStageChange = (index, field, value) => {
    const updated = [...stages];
    updated[index][field] = value;
    setStages(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const updatedProject = {
      ...project,
      title,
      description,
      timeline,
      stages
    };

    try {
      await onSave?.(updatedProject);
    } catch (err) {
      console.error('[EditProject] Failed to save project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Project Info">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />

        <Label>Description</Label>
        <TextArea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </FormSection>

      <FormSection title="Timeline Milestones">
        {timeline.map((event, i) => (
          <div key={i} className="space-y-2 border rounded p-3 mb-2">
            <Input
              placeholder="Milestone Title"
              value={event.title || ''}
              onChange={(e) => handleTimelineChange(i, 'title', e.target.value)}
            />
            <Input
              placeholder="Target Date"
              type="date"
              value={event.date || ''}
              onChange={(e) => handleTimelineChange(i, 'date', e.target.value)}
            />
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={() => setTimeline([...timeline, { title: '', date: '' }])}>
          + Add Milestone
        </Button>
      </FormSection>

      <FormSection title="Stages">
        {stages.map((stage, i) => (
          <div key={stage.id} className="space-y-2 border rounded p-3 mb-2">
            <Input
              placeholder="Stage Name"
              value={stage.name}
              onChange={(e) => handleStageChange(i, 'name', e.target.value)}
            />
            <TextArea
              placeholder="Stage Description"
              value={stage.description}
              onChange={(e) => handleStageChange(i, 'description', e.target.value)}
              rows={2}
            />
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={handleAddStage}>
          + Add Stage
        </Button>
      </FormSection>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Project'}
        </Button>
      </div>
    </form>
  );
};

export default EditProject;
