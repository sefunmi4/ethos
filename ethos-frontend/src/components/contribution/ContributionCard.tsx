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
}

const ContributionCard: React.FC<ContributionCardProps> = ({
  contribution,
  user,
  compact = false,
  onEdit,
  onDelete,
  questId,
  showStatusControl = true,
}) => {
  if (!contribution) return null;

  const { id } = contribution as any;

  if (!id) {
    console.warn('[ContributionCard] Missing `id` on contribution:', contribution);
    return null;
  }

  const sharedProps = { user, compact, onEdit, onDelete, showStatusControl };

  // ✅ Render Post types
  if ('type' in contribution) {
    return (
      <PostCard
        post={contribution as Post}
        questId={questId}
        {...sharedProps}
      />
    );
  }

  // 🧭 Render Quest
  if ("headPostId" in contribution || (contribution as any).kind === "quest") {
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
