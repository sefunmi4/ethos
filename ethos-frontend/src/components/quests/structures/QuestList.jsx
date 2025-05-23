import React from 'react';
import BoardItemList from '../../boards/structures/BoardItemList';
import BoardItemCard from '../../boards/BoardItemCard';

const QuestList = ({ items = [] }) => {
  return (
    <BoardItemList
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

export default QuestList;
