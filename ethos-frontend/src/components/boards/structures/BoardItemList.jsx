import React from 'react';

const BoardItemList = ({ items = [], renderItem }) => {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="bg-white rounded shadow-sm p-4 border border-gray-200">
          {renderItem ? renderItem(item) : <pre>{JSON.stringify(item, null, 2)}</pre>}
        </li>
      ))}
    </ul>
  );
};

export default BoardItemList;
