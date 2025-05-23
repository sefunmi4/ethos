import React from 'react';
import BoardItemCard from '../../boards/BoardItemCard';

const renderThread = (items, parentId = null, depth = 0) => {
  return items
    .filter((item) => item.parentId === parentId)
    .map((item) => (
      <div key={item.id} className={`ml-${depth * 4} mb-4`}>
        <BoardItemCard
          title={item.title || 'Reply'}
          subtitle={item.type}
          data={item}
          type={item.type}
        />
        {renderThread(items, item.id, depth + 1)}
      </div>
    ));
};

const ThreadList = ({ items = [] }) => {
  return <div className="space-y-2">{renderThread(items)}</div>;
};

export default ThreadList;
