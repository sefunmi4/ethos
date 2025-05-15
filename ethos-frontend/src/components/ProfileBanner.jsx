import React from 'react';

const ProfileBanner = ({ user }) => {
  if (!user) return null;

  const displayName = user.displayName || (user.id ? 'Adventurer_' + user.id.slice(0, 5) : 'Adventurer');
  const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between bg-white p-6 rounded-lg shadow-md mb-8">
      {/* Avatar + Identity */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-white bg-gradient-to-tr from-purple-500 to-indigo-500">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-800">{displayName}</h1>
          <p className="text-gray-500 text-sm mt-1">
            @{user.username || 'unknown'} · Joined {joinedDate}
          </p>
        </div>
      </div>

      {/* Roles & Actions */}
      <div className="mt-4 sm:mt-0 flex flex-col items-center sm:items-end gap-2">
        <div className="flex flex-wrap gap-2">
          {user.roles?.length > 0 ? (
            user.roles.map((role, index) => (
              <span
                key={index}
                className="text-xs font-medium bg-gray-100 px-3 py-1 rounded-full text-gray-700"
              >
                {role}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400 italic">No roles yet</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileBanner;