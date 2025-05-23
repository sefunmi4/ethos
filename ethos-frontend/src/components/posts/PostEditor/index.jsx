import React, { useState } from 'react';
import LinkControls from './LinkControls';
import RoleAssignment from './RoleAssignment';

const POST_TYPES = [
  { value: 'free_speech', label: '🗣️ Free Speech' },
  { value: 'request', label: '📌 Request' },
  { value: 'quest_log', label: '🧾 Quest Log' },
  { value: 'quest_task', label: '🎯 Quest Task' },
];

const PostEditor = ({ post = {}, quests = [], onSave, onCancel, onNewQuest }) => {
  const [type, setType] = useState(post.type || 'free_speech');
  const [content, setContent] = useState(post.content || '');
  const [linkedQuest, setLinkedQuest] = useState(post.questId || '');
  const [assignedRoles, setAssignedRoles] = useState(post.assignedRoles || []);
  const [newQuestTitle, setNewQuestTitle] = useState('');

  const showCreateQuest = linkedQuest === '__create';

  const handleSubmit = (e) => {
    e.preventDefault();

    if ((type === 'quest_log' || type === 'quest_task') && !linkedQuest) {
      alert('This post type must be linked to a quest.');
      return;
    }

    const updated = {
      ...post,
      type,
      content,
      questId: linkedQuest || null,
      assignedRoles: type === 'quest_task' ? assignedRoles : [],
      visibility: 'public',
    };

    onSave?.(updated);
  };

  const handleCreateQuest = () => {
    if (!newQuestTitle.trim()) return;

    const newQuest = {
      id: crypto.randomUUID(),
      title: newQuestTitle.trim(),
      createdAt: new Date().toISOString(),
    };

    onNewQuest?.(newQuest);
    setLinkedQuest(newQuest.id);
    setNewQuestTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Post Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Post Type</label>
        <select
          className="w-full border rounded px-3 py-2 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {POST_TYPES.map(({ value, label }) => {
            const requiresQuest = (value === 'quest_log' || value === 'quest_task');
            if (requiresQuest && !linkedQuest) return null;
            return <option key={value} value={value}>{label}</option>;
          })}
        </select>
      </div>

      {/* Content Area */}
      <textarea
        rows={6}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full border border-gray-300 rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Quest Linkage */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Link to Quest</label>
        <select
          className="w-full border rounded px-3 py-2 text-sm"
          value={linkedQuest || ''}
          onChange={(e) => setLinkedQuest(e.target.value)}
        >
          <option value="">None</option>
          {quests.map((q) => (
            <option key={q.id} value={q.id}>{q.title}</option>
          ))}
          <option value="__create">➕ Create and link a new quest</option>
        </select>

        {showCreateQuest && (
          <div className="mt-2">
            <input
              type="text"
              value={newQuestTitle}
              onChange={(e) => setNewQuestTitle(e.target.value)}
              placeholder="Enter new quest name"
              className="w-full border px-3 py-2 rounded text-sm"
              onBlur={handleCreateQuest}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateQuest();
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Role Assignment */}
      {type === 'quest_task' && (
        <RoleAssignment value={assignedRoles} onChange={setAssignedRoles} />
      )}

      {/* Footer Buttons */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:underline"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default PostEditor;