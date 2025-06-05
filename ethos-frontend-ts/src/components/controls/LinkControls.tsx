import React, { useEffect, useState } from 'react';
import Select from '../ui/Select';
import { createQuest, getAllQuests } from '../../api/quest';
import type { LinkedItem } from '../../types/postTypes';

interface LinkControlsProps {
  value: LinkedItem[];
  onChange: (updated: LinkedItem[]) => void;
  allowCreateNew?: boolean;
  allowNodeSelection?: boolean; 
  label?: string;
  currentPostId?: string | null;
}

const LinkControls: React.FC<LinkControlsProps> = ({
  value = [],
  onChange,
  allowCreateNew = true,
  label = 'Linked Item',
  currentPostId = null,
}) => {
  const [quests, setQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [questRes] = await Promise.allSettled([getAllQuests()]);
      if (questRes.status === 'fulfilled') setQuests(questRes.value || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleLinkSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [type, id] = e.target.value.split(':');
    const alreadyLinked = value.find((v) => v.itemId === id && v.itemType === type);
    if (!alreadyLinked) {
      onChange([...value, { itemId: id, itemType: type as 'quest', nodeId: '' }]);
    }
  };

  const handleUnlink = (item: LinkedItem) => {
    onChange(value.filter((v) => v.itemId !== item.itemId || v.itemType !== item.itemType));
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const created = await createQuest({ title: newTitle, fromPostId: currentPostId || undefined });
    const newLink: LinkedItem = {
      itemId: created.id,
      itemType: 'quest',
      nodeId: '',
    };
    setQuests((prev) => [...prev, created]);
    onChange([...value, newLink]);
    setNewTitle('');
    setCreating(false);
  };

  return (
    <div className="space-y-2">
      {loading ? (
        <p className="text-sm text-gray-500">Loading quests...</p>
      ) : (
        <>
          <Select
            value=""
            onChange={handleLinkSelect}
            options={[
              { value: '', label: `-- Select ${label} --`, disabled: true },
              ...quests.map((q) => ({ value: `quest:${q.id}`, label: `🧭 Quest: ${q.title}` })),
            ]}
          />

          {allowCreateNew && !creating && (
            <button
              type="button"
              className="text-blue-600 text-xs underline"
              onClick={() => setCreating(true)}
            >
              + Create new quest
            </button>
          )}

          {creating && (
            <div className="flex gap-2 items-center mt-2">
              <input
                type="text"
                className="border rounded px-2 py-1 text-sm"
                placeholder="New quest title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <button
                type="button"
                className="text-xs bg-indigo-600 text-white px-3 py-1 rounded"
                onClick={handleCreate}
              >
                Create
              </button>
            </div>
          )}

          {value.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-2 border rounded">
              <span className="text-sm">
                🔗 {item.itemType}: {item.itemId}
              </span>
              <button
                type="button"
                onClick={() => handleUnlink(item)}
                className="text-red-500 text-xs underline"
              >
                Unlink
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default LinkControls;