import React, { useEffect, useState } from 'react';
import Select from '../ui/Select';
import { addQuest, fetchAllQuests } from '../../api/quest';
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
  const linkTypes = ['solution', 'duplicate', 'related', 'quote', 'reference'];
  const linkStatuses = ['active', 'solved', 'pending', 'private'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [questRes] = await Promise.allSettled([fetchAllQuests()]);
      if (questRes.status === 'fulfilled') setQuests(questRes.value || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleLinkSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [type, id] = e.target.value.split(':');
    const alreadyLinked = value.find((v) => v.itemId === id && v.itemType === type);
    if (!alreadyLinked) {
      onChange([
        ...value,
        {
          itemId: id,
          itemType: type as 'quest',
          nodeId: '',
          linkType: 'related',
          linkStatus: 'active',
          cascadeSolution: false,
          notifyOnChange: false,
        },
      ]);
    }
  };

  const handleUnlink = (item: LinkedItem) => {
    onChange(value.filter((v) => v.itemId !== item.itemId || v.itemType !== item.itemType));
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const created = await addQuest({ title: newTitle, fromPostId: currentPostId || undefined });
    const newLink: LinkedItem = {
      itemId: created.id,
      itemType: 'quest',
      nodeId: '',
      linkType: 'related',
      linkStatus: 'active',
      cascadeSolution: false,
      notifyOnChange: false,
    };
    setQuests((prev) => [...prev, created]);
    onChange([...value, newLink]);
    setNewTitle('');
    setCreating(false);
  };

  const handleUpdate = (idx: number, key: keyof LinkedItem, val: any) => {
    const updated = [...value];
    updated[idx] = { ...updated[idx], [key]: val };
    onChange(updated);
  };

  const handleToggle = (idx: number, key: keyof LinkedItem) => {
    const updated = [...value];
    updated[idx] = { ...updated[idx], [key]: !updated[idx][key] };
    onChange(updated);
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
              ...quests.map((q) => ({
                value: `quest:${q.id}`,
                label: `🧭 Quest: ${q.title}`,
              })),
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
            <div key={idx} className="p-2 border rounded space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm">🔗 {item.itemType}: {item.itemId}</span>
                <button
                  type="button"
                  onClick={() => handleUnlink(item)}
                  className="text-red-500 text-xs underline"
                >
                  Unlink
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="text-gray-600">Type:</label>
                <select
                  value={item.linkType || 'related'}
                  onChange={(e) => handleUpdate(idx, 'linkType', e.target.value)}
                  className="border rounded px-1 py-0.5"
                >
                  {linkTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <label className="text-gray-600">Status:</label>
                <select
                  value={item.linkStatus || 'active'}
                  onChange={(e) => handleUpdate(idx, 'linkStatus', e.target.value)}
                  className="border rounded px-1 py-0.5"
                >
                  {linkStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <label className="text-gray-600">
                  <input
                    type="checkbox"
                    checked={item.cascadeSolution || false}
                    onChange={() => handleToggle(idx, 'cascadeSolution')}
                  /> 🔁 Cascade
                </label>

                <label className="text-gray-600">
                  <input
                    type="checkbox"
                    checked={item.notifyOnChange || false}
                    onChange={() => handleToggle(idx, 'notifyOnChange')}
                  /> 🔔 Notify
                </label>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default LinkControls;