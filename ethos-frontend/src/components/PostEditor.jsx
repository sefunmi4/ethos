import React, { useState, useEffect } from 'react';

const roleOptions = ['Creator', 'Developer', 'Merchant', 'Strategist', 'Maker'];
const postTypes = ['free_speech', 'request', 'quest_log', 'quest_task'];
const visibilityOptions = ['public', 'private'];

const PostEditor = ({
  mode = 'create', // 'create' or 'edit'
  user,
  quests = [],
  onPostCreated,
  onSave,
  onCancel,
  initialContent = '',
  initialType = 'free_speech',
  initialVisibility = 'public',
  initialQuestId = '',
  initialRoles = [],
}) => {
  const [content, setContent] = useState(initialContent);
  const [postType, setPostType] = useState(initialType);
  const [visibility, setVisibility] = useState(initialVisibility);
  const [assignedRoles, setAssignedRoles] = useState(initialRoles);
  const [linkedQuestId, setLinkedQuestId] = useState(initialQuestId);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (mode === 'edit') {
      setContent(initialContent);
      setPostType(initialType);
      setVisibility(initialVisibility);
      setLinkedQuestId(initialQuestId);
      setAssignedRoles(initialRoles);
    }
  }, [mode]);

  const toggleRole = (role) => {
    setAssignedRoles((prev) =>
      prev.includes(role) ? prev.filter((t) => t !== role) : [...prev, role]
    );
  };

  const handleSubmit = async () => {
    if (!content.trim()) return setError('Post content is required.');
    if ((postType === 'quest_log' || postType === 'quest_task') && !linkedQuestId) {
      return setError('This post must be linked to a quest.');
    }

    const newPost = {
      type: postType,
      content,
      visibility,
      questId: (postType === 'quest_log' || postType === 'quest_task') ? linkedQuestId : null,
      assignedRoles: postType === 'quest_task' ? assignedRoles : [],
      timestamp: new Date().toISOString(),
      userId: user.id,
    };

    try {
      setSubmitting(true);
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newPost),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Post failed: ${res.status} - ${errText}`);
      }

      const savedPost = await res.json();
      onPostCreated && onPostCreated(savedPost);

      // Reset
      setContent('');
      setAssignedRoles([]);
      setLinkedQuestId('');
      setPostType('free_speech');
      setVisibility('public');
      setError('');
      setSubmitting(false);
      setSuccessMsg('Post published!');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err) {
      console.error('[POST ERROR]', err);
      setError('Failed to submit post.');
      setSubmitting(false);
    }
  };

  const handleSave = () => {
    if (!content.trim()) return setError('Content cannot be empty.');
    if ((postType === 'quest_log' || postType === 'quest_task') && !linkedQuestId) {
      return setError('Missing quest link.');
    }
    onSave &&
      onSave({
        content,
        visibility,
        type: postType,
        questId: postType === 'quest_log' || postType === 'quest_task' ? linkedQuestId : null,
        assignedRoles: postType === 'quest_task' ? assignedRoles : [],
      });
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
      <textarea
        id="post-content"
        name="post-content"
        className="w-full border border-gray-300 rounded p-2 text-sm mb-3"
        rows="4"
        placeholder="Write your post..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="flex flex-wrap gap-3 text-sm mb-3">
        <select
          value={postType}
          onChange={(e) => setPostType(e.target.value)}
          className="border border-gray-300 rounded p-1"
        >
          {postTypes.map((type) => (
            <option key={type} value={type}>
              {type.replace('_', ' ')}
            </option>
          ))}
        </select>

        {(postType === 'quest_log' || postType === 'quest_task') && (
          <select
            value={linkedQuestId}
            onChange={(e) => setLinkedQuestId(e.target.value)}
            className="border border-gray-300 rounded p-1"
          >
            <option value="">-- Link a quest --</option>
            {quests.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </select>
        )}

        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          className="border border-gray-300 rounded p-1"
        >
          {visibilityOptions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {postType === 'quest_task' && (
        <div className="mb-3">
          <p className="text-sm font-medium mb-1">Assign to roles:</p>
          <div className="flex flex-wrap gap-2">
            {roleOptions.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  assignedRoles.includes(role)
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      {successMsg && mode === 'create' && (
        <p className="text-sm text-green-500 mb-2">{successMsg}</p>
      )}

      {/* Action Buttons */}
      {mode === 'edit' ? (
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`px-4 py-2 rounded text-sm text-white ${
            submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {submitting ? 'Posting...' : 'Post'}
        </button>
      )}
    </div>
  );
};

export default PostEditor;