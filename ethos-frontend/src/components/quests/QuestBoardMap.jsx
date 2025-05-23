import React from 'react';
import Board from '../boards/Board';
import BoardItemCard from '../boards/BoardItemCard';

/**
 * QuestBoardMap is a structure-aware board view designed for quests.
 * It treats posts and tasks as atomic nodes and builds visual relationships
 * (e.g. parent-child subtasks, logs linked to tasks) through board and linking logic.
 * The visual output is based on the Board component, which handles the layout,
 * ordering, filtering, and display mode (e.g. grid, list, tree).
 */
const QuestBoardMap = ({ quest, logs = [], tasks = [], structure = 'list' }) => {
  // Build log count map: taskId => number of logs
  const logMap = logs.reduce((acc, log) => {
    if (log.questId === quest.id && log.parentPostId) {
      acc[log.parentPostId] = (acc[log.parentPostId] || 0) + 1;
    }
    return acc;
  }, {});

  // Transform tasks into Board items
  const items = tasks.map((task) => ({
    id: task.id,
    type: 'quest_task',
    title: task.title || 'Unnamed Task',
    subtitle: `${logMap[task.id] || 0} log${logMap[task.id] === 1 ? '' : 's'}`,
    data: task,
    status: task.status || 'todo',
    priority: task.priority || 0,
    parentId: task.parentId || null,
    structure: task.structure || null,
  }));

  // Board handles visualization: list, tree, or grid depending on props/filters
  return (
    <div className="w-full border rounded-lg bg-white shadow-sm p-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">🧭 Quest Structure</h3>

      <Board
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
        structure={structure}
      />

      {items.length === 0 && (
        <p className="text-center text-gray-500 py-6">No structured tasks yet.</p>
      )}
    </div>
  );
};

export default QuestBoardMap;
