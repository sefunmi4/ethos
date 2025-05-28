// src/components/contribution/controls/LinkControls.jsx

import React, { useEffect, useState } from 'react';
import Select from '../../ui/Select';
import { axiosWithAuth } from '../../../utils/authUtils';

const LinkControls = ({ value, onChange, allowCreateNew = false }) => {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const res = await axiosWithAuth.get('/quests');
        setQuests(res.data);
      } catch (err) {
        console.error('[LinkControls] Failed to fetch quests:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuests();
  }, []);

  const handleNewQuest = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await axiosWithAuth.post('/quests', { title: newTitle });
      const newQuest = res.data;
      setQuests(prev => [...prev, newQuest]);
      onChange(newQuest.id);
      setNewTitle('');
    } catch (err) {
      console.error('[LinkControls] Failed to create new quest:', err);
    }
  };

  return (
    <div className="space-y-2">
      {loading ? (
        <p className="text-sm text-gray-500">Loading quests...</p>
      ) : (
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">— Select a Quest —</option>
          {quests.map((q) => (
            <option key={q.id} value={q.id}>
              {q.title}
            </option>
          ))}
        </Select>
      )}

      {allowCreateNew && (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            className="border rounded px-2 py-1 text-sm w-full"
            placeholder="New quest title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button
            type="button"
            onClick={handleNewQuest}
            className="text-xs bg-indigo-600 text-white px-3 py-1 rounded"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
};

export default LinkControls;