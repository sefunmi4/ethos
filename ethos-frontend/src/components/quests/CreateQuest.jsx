import React, { useState } from 'react';
import { POST_TYPES } from '../../constants/POST_TYPES';
import { Button, Input, TextArea, Select, Label, FormSection } from '../ui';
import RoleAssignment from '../contribution/RoleAssignment';
import CreateQuestInput from '../contribution/CreateQuestInput';

const CreateQuest = ({ onSave, onCancel, quests = [] }) => {
  const [content, setContent] = useState('');
  const [linkedQuest, setLinkedQuest] = useState('');
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tasks, setTasks] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const payload = {
      type: 'quest_log',
      content,
      questId: linkedQuest || null,
      assignedRoles,
      visibility: 'public',
      tasks: tasks.map(task => ({ ...task, type: 'quest_task' }))
    };

    try {
      await onSave?.(payload);
    } catch (err) {
      console.error('[CreateQuest] Failed to create quest:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateQuest = (newQuest) => {
    quests.push(newQuest);
    setLinkedQuest(newQuest.id);
    setNewQuestTitle('');
  };

  const addTask = () => {
    setTasks([...tasks, { id: crypto.randomUUID(), content: '', assignedRoles: [] }]);
  };

  const updateTask = (index, field, value) => {
    const updated = [...tasks];
    updated[index][field] = value;
    setTasks(updated);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Quest Details">
        <Label htmlFor="content">Quest Log</Label>
        <TextArea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Document the main quest log entry..."
          required
        />
      </FormSection>

      <FormSection title="Link to Parent Quest (Optional)">
        <Select
          value={linkedQuest}
          onChange={(e) => setLinkedQuest(e.target.value)}
          options={[
            { value: '', label: 'None' },
            ...quests.map(q => ({ value: q.id, label: q.title })),
            { value: '__create', label: '➕ Create new quest' },
          ]}
        />
        {linkedQuest === '__create' && (
          <CreateQuestInput
            value={newQuestTitle}
            onChange={setNewQuestTitle}
            onCreate={handleCreateQuest}
          />
        )}
      </FormSection>

      <FormSection title="Nested Tasks">
        {tasks.map((task, index) => (
          <div key={task.id} className="border rounded p-3 space-y-2">
            <TextArea
              value={task.content}
              onChange={(e) => updateTask(index, 'content', e.target.value)}
              placeholder={`Task ${index + 1}`}
              required
            />
            <RoleAssignment
              value={task.assignedRoles}
              onChange={(roles) => updateTask(index, 'assignedRoles', roles)}
            />
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={addTask}>+ Add Task</Button>
      </FormSection>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Quest'}
        </Button>
      </div>
    </form>
  );
};

export default CreateQuest;
