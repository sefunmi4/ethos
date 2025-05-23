import React from 'react';

const BoardItemScroll = ({ items = [], renderItem }) => {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 pb-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="min-w-[250px] max-w-sm flex-shrink-0 bg-white border border-gray-200 rounded shadow-sm p-4"
          >
            {renderItem ? renderItem(item) : <pre>{JSON.stringify(item, null, 2)}</pre>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoardItemScroll;
