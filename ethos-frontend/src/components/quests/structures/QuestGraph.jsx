import React from 'react';
import BoardItemCard from '../../boards/BoardItemCard';

const QuestGraph = ({ items = [] }) => {
  // This is a placeholder linear layout. Replace with a true graph visualization later.
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {items.map((item) => (
        <div key={item.id} className="bg-white border border-gray-200 rounded p-4">
          <BoardItemCard
            title={item.title}
            subtitle={item.subtitle}
            data={item.data}
            type={item.type}
          />
        </div>
      ))}
    </div>
  );
};

export default QuestGraph;