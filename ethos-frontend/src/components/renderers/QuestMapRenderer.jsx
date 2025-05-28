import React, { useState } from 'react';
import ContributionCard from '../contribution/ContrubitionCard'; // Optional fallback

const QuestNode = ({ node, level = 0, user  }) => {
  const [collapsed, setCollapsed] = useState(false);

  const hasChildren = node.children && node.children.length > 0;
  const indent = level * 16;

  return (
    <div className="ml-2 border-l border-gray-300 pl-4 mb-4">
      <div className="flex items-center gap-2">
        {hasChildren && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-xs text-gray-500 hover:underline"
          >
            {collapsed ? '[+]' : '[–]'}
          </button>
        )}
        <div className="flex-1">
          <ContributionCard item={node} style={{ marginLeft: indent }} user={user} />
        </div>
      </div>
      {!collapsed && hasChildren && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <QuestNode key={child.id} node={child} level={level + 1} user={user} />
          ))}
        </div>
      )}
    </div>
  );
};

const QuestMapRenderer = ({ rootQuest, user  }) => {
  if (!rootQuest) return <p className="text-gray-500">No quest data available.</p>;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <QuestNode node={rootQuest} user={user} />
    </div>
  );
};

export default QuestMapRenderer;
