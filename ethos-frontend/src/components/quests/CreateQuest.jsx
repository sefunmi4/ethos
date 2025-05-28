import React, { useState } from 'react';
import { Button, TextArea, Label, FormSection } from '../ui';
import RoleAssignment from '../contribution/controls/RoleAssignment';
import LinkControls from '../contribution/controls/LinkControls';
import { axiosWithAuth } from '../../utils/authUtils';

const CreateQuest = ({ onSave, onCancel }) => {
  const [content, setContent] = useState('');
  const [linkedQuestNode, setLinkedQuestNode] = useState(null);
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tasks, setTasks] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Step 1: Create the quest itself
      const title = content.slice(0, 60).trim() || 'Untitled Quest';
      const resQuest = await axiosWithAuth.post('/quests', {
        title,
        description: content.slice(0, 240),
        linkedPostId: null
      });

      const newQuest = resQuest.data;
      const questId = newQuest.id;

      // Step 2: Create the main quest_log post
      const resLog = await axiosWithAuth.post('/posts', {
        type: 'quest_log',
        content,
        questId,
        nodeId: null,
        assignedRoles,
        visibility: 'public'
      });

      const logPost = resLog.data;

      // Step 3: Optionally link this post to the quest explicitly
      await axiosWithAuth.post(`/quests/${questId}/link`, {
        postId: logPost.id
      });

      // Step 4: Create any nested task posts
      for (let task of tasks) {
        const resTask = await axiosWithAuth.post('/posts', {
          type: 'quest_task',
          content: task.content,
          questId,
          nodeId: null,
          assignedRoles: task.assignedRoles,
          visibility: 'public'
        });

        // Optional: Link the task as well
        await axiosWithAuth.post(`/quests/${questId}/link`, {
          postId: resTask.data.id
        });
      }

      onSave?.({ quest: newQuest, logPost, tasks });
    } catch (err) {
      console.error('[CreateQuest] Failed to create quest:', err);
    } finally {
      setIsSubmitting(false);
    }
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
      <FormSection title="Quest Log">
        <Label htmlFor="content">Log Entry</Label>
        <TextArea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe the main quest objective or story here..."
          required
        />
      </FormSection>

      <FormSection title="Link to Parent Quest (Optional)">
        <LinkControls
          value={linkedQuestNode}
          onChange={setLinkedQuestNode}
          allowCreateNew={true}
          allowNodeSelection={true}
        />
      </FormSection>

      <FormSection title="Add Tasks">
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