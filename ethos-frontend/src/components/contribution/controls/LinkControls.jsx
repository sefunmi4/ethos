import React, { useEffect, useState } from 'react';
import Select from '../../ui/Select';
import { axiosWithAuth } from '../../../utils/authUtils';

const LinkControls = ({
  value,
  onChange,
  allowCreateNew = true,
  allowNodeSelection = false,
  label = 'Item'
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);

  const itemId = value?.itemId || '';
  const nodeId = value?.nodeId || '';

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axiosWithAuth.get('/quests'); // Replace with generic endpoint if needed
        setItems(res.data || []);
      } catch (err) {
        console.error('[LinkControls] Failed to fetch items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleSelectItem = (e) => {
    const val = e.target.value;

    if (val === '__create') {
      setCreatingNew(true);
    } else if (!val) {
      setCreatingNew(false);
      onChange(null);
    } else {
      setCreatingNew(false);
      onChange({
        itemId: val,
        nodeId: '',
        itemType: 'quest' // ✅ include item type
      });
    }
  };

  const handleCreateItem = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await axiosWithAuth.post('/quests', { title: newTitle }); // Replace if needed
      const newItem = res.data;
      setItems((prev) => [...prev, newItem]);
      onChange({
        itemId: newItem.id,
        nodeId: '',
        itemType: 'quest' // ✅ include item type
      });
      setNewTitle('');
      setCreatingNew(false);
    } catch (err) {
      console.error('[LinkControls] Failed to create new item:', err);
    }
  };

  const handleSelectNode = (e) => {
    const val = e.target.value;
    onChange({
      itemId,
      nodeId: val,
      itemType: 'quest' // ✅ always emit full structure
    });
  };

  const selectedItem = items.find((q) => q.id === itemId);
  const subNodes = selectedItem ? [...(selectedItem.logs || []), ...(selectedItem.tasks || [])] : [];

  return (
    <div className="space-y-2">
      {loading ? (
        <p className="text-sm text-gray-500">Loading {label.toLowerCase()}s...</p>
      ) : (
        <>
          <Select
            value={creatingNew ? '__create' : itemId}
            onChange={handleSelectItem}
            options={[
              { value: '', label: `— Select a ${label} —` },
              ...items.map((q) => ({ value: q.id, label: q.title })),
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
                onClick={handleCreateItem}
                className="text-xs bg-indigo-600 text-white px-3 py-1 rounded"
              >
                Create
              </button>
            </div>
          )}

          {allowNodeSelection && selectedItem && subNodes.length > 0 && (
            <Select
              value={nodeId}
              onChange={handleSelectNode}
              options={[
                { value: '', label: '— No parent —' },
                ...subNodes.map((node) => ({
                  value: node.id,
                  label: `${node.type === 'quest_log' ? '📘 Log' : '📌 Task'}: ${node.content.slice(0, 30)}...`
                }))
              ]}
            />
          )}
        </>
      )}
    </div>
  );
};

export default LinkControls;