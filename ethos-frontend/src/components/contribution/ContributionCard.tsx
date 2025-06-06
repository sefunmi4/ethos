// src/components/contribution/ContributionCard.tsx

import React from 'react';
import PostCard from '../post/PostCard';
import QuestCard from '../quest/QuestCard';

import type { Post, PostType } from '../../types/postTypes';
import type { Quest } from '../../types/questTypes';
import type { BoardData } from '../../types/boardTypes';
import type { User } from '../../types/userTypes';

type Contribution = Post | Quest | BoardData;

interface ContributionCardProps {
  contribution: Contribution;
  user?: User;
  compact?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  questId?: string;
}

const ContributionCard: React.FC<ContributionCardProps> = ({
  contribution,
  user,
  compact = false,
  onEdit,
  onDelete,
  questId,
}) => {
  if (!contribution) return null;

  const { id, type, kind } = contribution as any;

  if (!id) {
    console.warn('[ContributionCard] Missing `id` on contribution:', contribution);
    return null;
  }

  const sharedProps = { user, compact, onEdit, onDelete };

  // ✅ Render Post types
  if ('type' in contribution) {
    const postType = contribution.type as PostType;

    // Accept all supported post types including commit-style ones
    if ([
      'free_speech', 'request', 'quest', 'task',
      'log', 'quest_log', 'commit', 'issue'
    ].includes(postType)) {
      return <PostCard post={contribution as Post} questId={questId} {...sharedProps} />;
    }

    console.warn('[ContributionCard] Unsupported post type:', postType);
    return (
      <div className="p-4 border rounded text-sm text-red-600 bg-red-50">
        Unsupported post type: <strong>{postType}</strong>
      </div>
    );
  }

  // 🧭 Render Quest
  if (kind === 'quest') {
    return (
      <QuestCard
        quest={contribution as Quest}
        user={user}
        compact={compact}
        onEdit={onEdit ? () => onEdit((contribution as Quest).id) : undefined}
        onDelete={onDelete ? (quest) => onDelete(quest.id) : undefined}
      />
    );
  }

  // 🛑 Fallback for unknown types
  console.warn('[ContributionCard] Unknown contribution kind:', kind);
  return (
    <div className="p-4 border rounded text-sm text-gray-600 bg-gray-50">
      Unknown contribution type: <strong>{type || kind || 'unknown'}</strong>
    </div>
  );
};

export default ContributionCard;