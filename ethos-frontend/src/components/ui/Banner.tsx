import React from 'react';
import { TAG_BASE } from '../../constants/styles';
import type { User } from '../../types/userTypes';
import type { Quest } from '../../types/questTypes';
import type { CollaberatorRoles } from '../../types/postTypes';

interface BannerProps {
  user?: User;
  quest?: Quest;
  /** Optional quest creator display name */
  creatorName?: string;
  readOnly?: boolean;
}

/**
 * Shared banner component for rendering either a User profile
 * or a Quest header depending on which prop is provided.
 *
 * - If `user` is passed, displays user profile info.
 * - If `quest` is passed, displays quest overview.
 * - `readOnly` disables interactive options if true.
 */
const Banner: React.FC<BannerProps> = ({ user, quest, creatorName }) => {
  if (!user && !quest) return null;

  const displayName = user
    ? user.username || `Adventurer_${user.id.slice(0, 5)}`
    : quest?.title || 'Untitled Quest';

  const description = user
    ? user.bio || 'This adventurer has yet to write their story...'
    : quest?.description || 'No quest description provided.';

  const tags = user?.tags || quest?.collaborators || [];

  const creatorDisplay =
    quest && (creatorName || quest.author?.username || quest.authorId)
      ? `Created by @${creatorName || quest.author?.username || quest.authorId}`
      : null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-accent-muted p-4 sm:p-6 rounded-lg shadow mb-6">
      {/* Left: Name + Description */}
      <div className="flex flex-col gap-1 text-left max-w-2xl">
        <h1 className="text-2xl font-bold text-primary dark:text-primary">
          {user ? displayName : `📜 ${displayName}`}
        </h1>
        <p className="text-sm text-gray-800 dark:text-gray-400">{description}</p>
        {creatorDisplay && (
          <p className="text-xs text-secondary mt-1">{creatorDisplay}</p>
        )}
      </div>

      {/* Right: Tags or Roles */}
      <div className="mt-4 sm:mt-0 flex flex-wrap justify-start sm:justify-end gap-2">
        {tags.length > 0 ? (
          <>
            {Array.from(new Set(tags.filter(t => typeof t === 'string') as string[])).map((tag) => (
              <span key={tag} className={TAG_BASE}>#{tag}</span>
            ))}
            {tags
              .filter((t): t is CollaberatorRoles => typeof t !== 'string')
              .map((tag, index) => (
                <span
                  key={index}
                  className="text-xs font-medium bg-gray-200 dark:bg-gray-600 px-3 py-1 rounded-full text-indigo-700 dark:text-indigo-300"
                >
                  @{tag.username || tag.userId}
                </span>
              ))}
          </>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-500 italic">
            {user ? 'No tags' : 'No collaborators'}
          </span>
        )}
      </div>
    </div>
  );
};

export default Banner;