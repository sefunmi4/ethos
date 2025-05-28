// src/components/boards/Board.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { axiosWithAuth } from '../../utils/authUtils';
import BoardItemCard from './BoardItemCard';
import ListRenderer from '../renderers/ListRenderer';
import GridRenderer from '../renderers/GridRenderer';
import QuestMapRenderer from '../renderers/QuestMapRenderer';
import ProjectPathRenderer from '../renderers/ProjectPathRenderer';
import { Button, Input, Select } from '../ui';
import CreateContribution from '../contribution/CreateContribution';

const Board = ({ boardId, board: initialBoard, structure: forcedStructure, title: forcedTitle, user }) => {
  const [board, setBoard] = useState(initialBoard || null);
  const [items, setItems] = useState(initialBoard?.enrichedItems || []);
  const [filterText, setFilterText] = useState('');
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(!initialBoard && !!boardId);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (boardId && !initialBoard) {
      setLoading(true);
      axiosWithAuth
        .get(`/boards/${boardId}?enrich=true`)
        .then((res) => {
          setBoard(res.data);
          setItems(res.data.enrichedItems || []);
        })
        .catch((err) => console.error('[Board] Load failed:', err))
        .finally(() => setLoading(false));
    }
  }, [boardId, initialBoard]);

  const filteredItems = useMemo(() => {
    return items
      .filter(item =>
        (item.title || item.content || '')
          .toLowerCase()
          .includes(filterText.toLowerCase())
      )
      .sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        return sortOrder === 'asc' ? aVal > bVal ? 1 : -1 : aVal < bVal ? 1 : -1;
      });
  }, [items, filterText, sortKey, sortOrder]);

  const handleAddItemToList = async (newPost) => {
    const updatedItems = [newPost.id, ...(board.items || [])];
  
    await axiosWithAuth.patch(`/boards/${board.id}`, { items: updatedItems });
  
    const res = await axiosWithAuth.get(`/boards/${board.id}?enrich=true`);
    setBoard(res.data);
    setItems(res.data.enrichedItems || []);
  
    // ✅ Hide the form once done
    setShowCreateForm(false);
  };

  const renderItems = () => {
    const props = {
      items: filteredItems,
      renderItem: (item) => <BoardItemCard key={item.id} item={item}  user={user} />
    };

    const structure = forcedStructure || board?.structure || 'grid';

    switch (structure) {
      case 'list': return <ListRenderer {...props}  user={user} />;
      case 'grid': return <GridRenderer {...props}  user={user} />;
      case 'quest': return <QuestMapRenderer quests={filteredItems}  user={user} />;
      case 'project': return <ProjectPathRenderer projects={filteredItems}  user={user} />;
      default: return <GridRenderer {...props}  user={user} />;
    }
  };

  if (loading) return <div className="text-gray-500 p-4">Loading board...</div>;
  if (!board) return <div className="text-red-500 p-4">Board not found.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-gray-800">
          {forcedTitle || board.title || 'Board'}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter..."
            className="w-40 text-sm"
          />
          <Select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            options={[
              { value: 'createdAt', label: 'Date' },
              { value: 'title', label: 'Title' }
            ]}
          />
          <Select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            options={[
              { value: 'asc', label: 'Asc' },
              { value: 'desc', label: 'Desc' }
            ]}
          />
          <Button variant="primary" onClick={() => setShowCreateForm(true)}>
            + Add Item
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <div className="border rounded-lg p-4 bg-white shadow">
          <CreateContribution
            onSave={handleAddItemToList}
            onCancel={() => setShowCreateForm(false)}
            boards={[board]}
            quests={[]} // Pass actual quest list if available
          />
        </div>
      )}

      {renderItems()}
    </div>
  );
};

export default Board;