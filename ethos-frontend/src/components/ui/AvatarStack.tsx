import React from 'react';
import { FaUser } from 'react-icons/fa';

export interface AvatarUser {
  avatarUrl?: string;
  username?: string;
}

interface AvatarStackProps {
  users: AvatarUser[];
  max?: number;
}

const AvatarStack: React.FC<AvatarStackProps> = ({ users, max = 3 }) => {
  const displayed = users.slice(0, max);
  const leftover = users.length - displayed.length;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {displayed.map((u, idx) => (
          u.avatarUrl ? (
            <img
              key={idx}
              src={u.avatarUrl}
              alt={u.username || 'avatar'}
              className="w-6 h-6 rounded-full border-2 border-surface"
            />
          ) : (
            <div
              key={idx}
              className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center border-2 border-surface text-gray-600"
            >
              <FaUser className="w-3 h-3" />
            </div>
          )
        ))}
        {leftover > 0 && (
          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center border-2 border-surface text-xs text-primary">
            +{leftover}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarStack;
