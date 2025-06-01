import React, { useEffect, useState } from 'react';
import Select from '../../ui/Select';
import { axiosWithAuth } from '../../../utils/authUtils';

const LinkControls = ({
  value = [], // array of { itemId, itemType, nodeId }
  onChange,
  allowCreateNew = true,
  allowNodeSelection = false,
  label = 'Item',
  currentPostId = null,
}) => {
  const [quests, setQuests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);
  const [newType, setNewType] = useState('quest');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const [questRes, projectRes] = await Promise.allSettled([
          axiosWithAuth.get('/quests'),
          axiosWithAuth.get('/projects'),
        ]);

        setQuests(questRes.status === 'fulfilled' ? questRes.value.data || [] : []);
        setProjects(projectRes.status === 'fulfilled' ? projectRes.value.data || [] : []);
      } catch (err) {
        console.error('[LinkControls] Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const allItems = [
    ...quests.map((q) => ({ ...q, itemType: 'quest' })),
    ...projects.map((p) => ({ ...p, itemType: 'project' })),
  ];

  const selectedValue = creatingNew
    ? '__create'
    : Array.isArray(value) && value.length > 0
    ? `${value[value.length - 1].itemType}:${value[value.length - 1].itemId}`
    : '';

  const handleSelectItem = (e) => {
    const val = e.target.value;
    const safeValue = Array.isArray(value) ? value : [];

    if (val === '__create') {
      setCreatingNew(true);
      return;
    }

    if (!val) {
      setCreatingNew(false);
      return;
    }

    const [type, id] = val.split(':');
    const newLink = { itemId: id, itemType: type, nodeId: '' };

    const exists = safeValue.some((v) => v.itemId === id && v.itemType === type);
    if (!exists) {
      onChange([newLink, ...safeValue.filter((v) => !(v.itemId === id && v.itemType === type))]);
    }

    setCreatingNew(false);
  };

  const handleUnlinkItem = (unlinkItem) => {
    onChange(value.filter((v) => !(v.itemId === unlinkItem.itemId && v.itemType === unlinkItem.itemType)));
  };

  const handleSelectNode = (e, item) => {
    const updated = value.map((v) =>
      v.itemId === item.itemId && v.itemType === item.itemType
        ? { ...v, nodeId: e.target.value }
        : v
    );
    onChange(updated);
  };

  const handleCreateItem = async () => {
    if (!newTitle.trim()) return;
    try {
      const endpoint = newType === 'quest' ? '/quests' : '/projects';
      const res = await axiosWithAuth.post(endpoint, {
        title: newTitle,
        ...(newType === 'quest' && currentPostId ? { initialPostId: currentPostId } : {}),
      });

      const newItem = res.data;
      if (newType === 'quest') setQuests((prev) => [...prev, newItem]);
      else setProjects((prev) => [...prev, newItem]);

      const newLink = { itemId: newItem.id, itemType: newType, nodeId: '' };
      onChange([...(value || []), newLink]);

      setNewTitle('');
      setCreatingNew(false);
    } catch (err) {
      console.error('[LinkControls] Failed to create new item:', err);
    }
  };

  return (
    <div className="space-y-2">
      {loading ? (
        <p className="text-sm text-gray-500">Loading items...</p>
      ) : (
        <>
          {allItems.length === 0 && !creatingNew && (
            <p className="text-sm text-gray-400 italic">
              No quests or projects found. You can create a new quest or project below.
            </p>
          )}

          <Select
            value={selectedValue}
            onChange={handleSelectItem}
            options={[
              { value: '', label: '— Select an Item to Link —', disabled: true },
              ...allItems.map((item) => ({
                value: `${item.itemType}:${item.id}`,
                label: `${item.itemType === 'quest' ? '🧭 Quest' : '📁 Project'}: ${item.title || 'Untitled'}`
              })),
              ...(allowCreateNew
                ? [{ value: '__create', label: '➕ Add new item (Quest or Project)' }]
                : [])
            ]}
          />

          {creatingNew && (
            <div className="flex items-center gap-2 mt-2">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="quest">🧭 Quest</option>
                <option value="project">📁 Project</option>
              </select>
              <input
                type="text"
                className="border rounded px-2 py-1 text-sm w-full"
                placeholder={`New ${newType} title`}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <button
                type="button"
                onClick={handleCreateItem}
                className="text-xs bg-indigo-600 text-white px-3 py-1 rounded"
              >
                Create
              </button>
            </div>
          )}

          {Array.isArray(value) && value.length > 0 && value.map((item) => {
            const isQuest = item.itemType === 'quest';
            const selectedItem = isQuest
              ? quests.find((q) => q.id === item.itemId)
              : projects.find((p) => p.id === item.itemId);

            const subNodes =
              isQuest && selectedItem
                ? [...(selectedItem.logs || []), ...(selectedItem.tasks || [])]
                : [];

            return (
              <div key={`${item.itemType}-${item.itemId}`} className="border rounded p-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500 italic">
                    {selectedItem
                      ? `${item.itemType === 'quest' ? '🧭 Quest' : '📁 Project'}: ${selectedItem.title || 'Untitled'}`
                      : '⚠️ Linked item not found'}
                  </span>
                  <button
                    onClick={() => handleUnlinkItem(item)}
                    className="text-red-600 text-xs underline ml-2"
                  >
                    Unlink
                  </button>
                </div>

                {allowNodeSelection && isQuest && subNodes.length > 0 && (
                  <Select
                    value={item.nodeId || ''}
                    onChange={(e) => handleSelectNode(e, item)}
                    options={[
                      { value: '', label: '— No parent —' },
                      ...subNodes.map((node) => ({
                        value: node?.id || '',
                        label: node?.type && node?.content
                          ? `${node.type === 'quest_log' ? '📘 Log' : '📌 Task'}: ${node.content.slice(0, 30)}...`
                          : '⚠️ Unknown node'
                      }))
                    ]}
                    className="mt-1"
                  />
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default LinkControls;