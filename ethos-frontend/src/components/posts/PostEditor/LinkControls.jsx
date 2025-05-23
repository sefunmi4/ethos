import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';

const LinkControls = ({ value, onChange, allowCreateNew = true, readOnly = false }) => {
  const { user } = useAuth();
  const [availableQuests, setAvailableQuests] = useState([]);
  const [selected, setSelected] = useState(value || '');
  const [creating, setCreating] = useState(false);
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [creatingQuest, setCreatingQuest] = useState(false);

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const res = await axios.get('/api/quests');
        setAvailableQuests(res.data);
      } catch (err) {
        console.error('Failed to fetch quests', err);
      }
    };
    fetchQuests();
  }, []);

  const handleChange = (e) => {
    const newVal = e.target.value;
    setSelected(newVal);
    onChange?.(newVal);
  };

  const handleCreate = async () => {
    if (!newQuestTitle.trim() || creatingQuest || !user?.id) return;

    setCreatingQuest(true);
    try {
      const res = await axios.post('/api/quests', {
        title: newQuestTitle.trim(),
        authorId: user.id
      });

      const newQuest = res.data;
      setAvailableQuests((prev) => [...prev, newQuest]);
      setSelected(newQuest.id);
      onChange?.(newQuest.id);
      setNewQuestTitle('');
      setCreating(false);
    } catch (err) {
      console.error('Failed to create quest:', err);
    } finally {
      setCreatingQuest(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Link to Quest</label>
      <select
        disabled={readOnly}
        className="w-full border px-3 py-2 rounded text-sm"
        value={selected}
        onChange={handleChange}
      >
        <option value="">None</option>
        {availableQuests.map((quest) => (
          <option key={quest.id} value={quest.id}>
            {quest.title}
          </option>
        ))}
      </select>

      {allowCreateNew && !creating && !readOnly && (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="text-sm text-blue-600 hover:underline"
        >
          ➕ Create and link a new quest
        </button>
      )}

      {creating && (
        <div className="flex gap-2 mt-1">
          <input
            type="text"
            value={newQuestTitle}
            onChange={(e) => setNewQuestTitle(e.target.value)}
            placeholder="New quest title"
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
          />
          <button
            type="button"
            disabled={creatingQuest}
            onClick={handleCreate}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {creatingQuest ? 'Creating...' : 'Create'}
          </button>
        </div>
      )}
    </div>
  );
};

export default LinkControls;