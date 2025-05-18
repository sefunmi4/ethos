import React from 'react';

const ProfileBanner = ({ user }) => {
  if (!user) return null;

  const displayName = user.displayName || (user.id ? 'Adventurer_' + user.id.slice(0, 5) : 'Adventurer');

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center bg-white p-4 sm:p-6 rounded-lg shadow mb-6">
      {/* Display Name */}
      <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
        <h1 className="text-2xl font-bold text-gray-800">{displayName}</h1>
        <p className="text-sm text-gray-500">@{user.username || 'unknown'}</p>
      </div>

      {/* Tags (Roles) */}
      <div className="mt-4 sm:mt-0 flex flex-wrap justify-center sm:justify-end gap-2">
        {user.roles?.length > 0 ? (
          user.roles.map((role, index) => (
            <span
              key={index}
              className="text-xs font-medium bg-gray-100 px-3 py-1 rounded-full text-gray-700"
            >
              #{role}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-400 italic">No tags</span>
        )}
      </div>
    </div>
  );
};

export default ProfileBanner;