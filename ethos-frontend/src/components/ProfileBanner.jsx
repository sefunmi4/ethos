import React from 'react';

const ProfileBanner = ({ user }) => {
  if (!user) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between bg-white p-6 rounded-lg shadow-md mb-8">
      {/* Avatar + Identity */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-white bg-gradient-to-tr from-purple-500 to-indigo-500">
          {user.displayName?.charAt(0).toUpperCase() || '👤'}
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-800">
            {user.displayName || 'Adventurer_' + user.id.slice(0, 5)}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            @{user.username} · Joined {new Date(user.createdAt).toLocaleDateString()}
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
        <button className="mt-2 text-sm text-blue-600 hover:underline">
          Customize Profile →
        </button>
      </div>
    </div>
  );
};

export default ProfileBanner;