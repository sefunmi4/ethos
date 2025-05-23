import React from 'react';
import BoardItemGrid from '../../boards/structures/BoardItemGrid';
import BoardItemCard from '../../boards/BoardItemCard';

const QuestGrid = ({ items = [] }) => {
  return (
    <BoardItemGrid
      items={items}
      renderItem={(item) => (
        <BoardItemCard
          key={item.id}
          title={item.title}
          subtitle={item.subtitle}
          data={item.data}
          type={item.type}
        />
      )}
    />
  );
};

export default QuestGrid;
