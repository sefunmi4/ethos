import React, { useState } from 'react';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import FormSection from '../ui/FormSection';
import LinkControls from '../../posts/LinkControls';
import RoleAssignment from '../../posts/RoleAssignment';

const CreateProject = ({ onSave, onCancel, availableQuests = [] }) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [timeline, setTimeline] = useState('');
  const [linkedQuests, setLinkedQuests] = useState([]);
  const [githubUrl, setGithubUrl] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const newProject = {
      type: 'project',
      title,
      summary,
      timeline,
      linkedQuests,
      githubUrl,
      docUrl,
      assignedRoles,
      createdAt: new Date().toISOString(),
    };

    try {
      await onSave?.(newProject);
    } catch (err) {
      console.error('[CreateProject] Failed to create project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Project Details">
        <Input label="Project Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <TextArea
          label="Summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Describe the purpose or goal of this project."
          maxLength={500}
        />
      </FormSection>

      <FormSection title="Linked Quests">
        <Select
          label="Add Quest Links"
          multiple
          options={availableQuests.map(q => ({ value: q.id, label: q.title }))}
          value={linkedQuests}
          onChange={setLinkedQuests}
        />
      </FormSection>

      <FormSection title="Timeline & Resources">
        <Input
          label="Timeline"
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
          placeholder="e.g. Q2 2025 - Q4 2025"
        />
        <Input
          label="GitHub Repository (optional)"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="https://github.com/username/project"
        />
        <Input
          label="Documentation URL (optional)"
          value={docUrl}
          onChange={(e) => setDocUrl(e.target.value)}
          placeholder="https://docs.example.com/project"
        />
      </FormSection>

      <FormSection title="Assign Roles">
        <RoleAssignment value={assignedRoles} onChange={setAssignedRoles} />
      </FormSection>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting}>
          Create Project
        </Button>
      </div>
    </form>
  );
};

export default CreateProject;
