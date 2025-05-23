import React from 'react';
import BoardItemCard from '../../boards/BoardItemCard';

const renderTree = (items, parentId = null, depth = 0) => {
  return items
    .filter((item) => item.parentId === parentId)
    .map((item) => (
      <div key={item.id} className={`ml-${depth * 4} mb-4`}>
        <BoardItemCard
          title={item.title}
          subtitle={item.subtitle}
          data={item.data}
          type={item.type}
        />
        {renderTree(items, item.id, depth + 1)}
      </div>
    ));
};

const QuestTree = ({ items = [] }) => {
  return <div className="space-y-2">{renderTree(items)}</div>;
};

export default QuestTree;
