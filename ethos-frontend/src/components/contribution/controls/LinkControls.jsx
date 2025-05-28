import React, { useEffect, useState } from 'react';
import Select from '../../ui/Select';
import { axiosWithAuth } from '../../../utils/authUtils';

const LinkControls = ({
  value,
  onChange,
  allowCreateNew = true,
  label = 'Quest'
}) => {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const res = await axiosWithAuth.get('/quests');
        setQuests(res.data || []);
      } catch (err) {
        console.error('[LinkControls] Failed to fetch quests:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuests();
  }, []);

  const handleSelect = (e) => {
    const val = e.target.value;
    if (val === '__create') {
      setCreatingNew(true);
    } else {
      setCreatingNew(false);
      onChange(val); // Pass quest ID string (or object, depending on usage)
    }
  };

  const handleCreateQuest = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await axiosWithAuth.post('/quests', { title: newTitle });
      const newQuest = res.data;
      setQuests((prev) => [...prev, newQuest]);
      onChange(newQuest.id); // or onChange({ questId: newQuest.id }) for object shape
      setNewTitle('');
      setCreatingNew(false);
    } catch (err) {
      console.error('[LinkControls] Failed to create new quest:', err);
    }
  };

  return (
    <div className="space-y-2">
      {loading ? (
        <p className="text-sm text-gray-500">Loading {label.toLowerCase()}s...</p>
      ) : (
        <>
          <Select
            value={creatingNew ? '__create' : value || ''}
            onChange={handleSelect}
            options={[
                { value: '', label: `— Select a ${label} —` },
                ...quests.map((q) => ({ value: q.id, label: q.title })),
                ...(allowCreateNew ? [{ value: '__create', label: `➕ Create new ${label.toLowerCase()}` }] : [])
            ]}
          />

          {creatingNew && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                className="border rounded px-2 py-1 text-sm w-full"
                placeholder={`New ${label.toLowerCase()} title`}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <button
                type="button"
                onClick={handleCreateQuest}
                className="text-xs bg-indigo-600 text-white px-3 py-1 rounded"
              >
                Create
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LinkControls;