import React from 'react';

const BoardToolbar = ({
  title = 'Board',
  viewMode,
  setViewMode,
  filters = {},
  setFilters,
}) => {
  const handleViewChange = (e) => setViewMode?.(e.target.value);

  const handleTypeFilter = (e) => {
    const value = e.target.value;
    setFilters?.({ ...filters, type: value || undefined });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>

      <div className="flex gap-4 items-center">
        <select
          className="border text-sm px-3 py-2 rounded bg-white text-gray-700"
          value={filters.type || ''}
          onChange={handleTypeFilter}
        >
          <option value="">All Types</option>
          <option value="quest">Quests</option>
          <option value="quest_log">Logs</option>
          <option value="task">Tasks</option>
          <option value="request">Requests</option>
          <option value="free_speech">Free Speech</option>
          <option value="comment">Comments</option>
        </select>

        <select
          className="border text-sm px-3 py-2 rounded bg-white text-gray-700"
          value={viewMode || 'list'}
          onChange={handleViewChange}
        >
          <option value="list">List</option>
          <option value="grid">Grid</option>
          <option value="scroll">Scroll</option>
        </select>
      </div>
    </div>
  );
};

export default BoardToolbar;
