// src/components/contribution/ContributionCard.tsx

import React from 'react';
import PostCard from '../post/PostCard';
import QuestCard from '../quest/QuestCard';

import type { Post } from '../../types/postTypes';
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
  /** Show status dropdowns for task posts when rendering PostCard */
  showStatusControl?: boolean;
  /** Render only the post header */
  headerOnly?: boolean;
  /** Expand replies when rendering PostCard */
  initialShowReplies?: boolean;
}

const ContributionCard: React.FC<ContributionCardProps> = ({
  contribution,
  user,
  compact = false,
  onEdit,
  onDelete,
  questId,
  showStatusControl = true,
  headerOnly = false,
  initialShowReplies = false,
}) => {
  if (!contribution) return null;

  const { id } = contribution;

  if (!id) {
    console.warn('[ContributionCard] Missing `id` on contribution:', contribution);
    return null;
  }

  const sharedProps = { user, compact, onEdit, onDelete, showStatusControl, headerOnly, initialShowReplies };

  // ✅ Render Post types
  if ('type' in contribution) {
    const post = contribution as Post;
    return (
      <PostCard
        post={post}
        questId={questId}
        {...sharedProps}
        headerOnly={headerOnly}
      />
    );
  }

  // 🧭 Render Quest
  if ('headPostId' in contribution) {
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
  console.warn("[ContributionCard] Unknown contribution type:", contribution);
  return (
    <div className="p-4 border border-secondary rounded text-sm text-secondary bg-background">
      Unknown contribution type
    </div>
  );
};

export default ContributionCard;
