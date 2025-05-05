import React from 'react';

const QuickInfoGrid = ({ user }) => {
  if (!user) return null;

  // Default values just in case
  const xp = user.xp || 0;
  const rank = user.rank || 'Unranked';
  const quests = user.questsCompleted || 0;
  const followers = user.followers || 0;

  const stats = [
    { label: 'Rank', value: rank },
    { label: 'XP', value: xp.toLocaleString() },
    { label: 'Quests Completed', value: quests },
    { label: 'Followers', value: followers },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center shadow-sm"
        >
          <div className="text-xl font-bold text-gray-800">{stat.value}</div>
          <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

export default QuickInfoGrid;