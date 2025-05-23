import React from 'react';

const BoardItemGrid = ({ items = [], renderItem }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {items.map((item) => (
        <div key={item.id} className="bg-white rounded shadow-sm border border-gray-200 p-4">
          {renderItem ? renderItem(item) : <pre>{JSON.stringify(item, null, 2)}</pre>}
        </div>
      ))}
    </div>
  );
};

export default BoardItemGrid;
