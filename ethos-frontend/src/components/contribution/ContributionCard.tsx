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
  /** Board ID where this contribution is rendered */
  boardId?: string;
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
  boardId,
}) => {
  if (!contribution) return null;

  const { id } = contribution;

  if (!id) {
    console.warn('[ContributionCard] Missing `id` on contribution:', contribution);
    return null;
  }

  const sharedProps = { user, compact, onEdit, onDelete, showStatusControl, headerOnly, initialShowReplies, boardId };

  // ✅ Render Post types
  if ('type' in contribution) {
    const post = contribution as Post;
    return (
      <PostCard
        post={post}
        questId={questId}
        {...sharedProps}
        headerOnly={headerOnly || post.type === 'request'}
        boardId={boardId}
      />
    );
  }

  // 🧭 Render Quest
  if ('headPostId' in contribution) {
    const quest = contribution as Quest;

    // Display quests on the timeline board like regular posts for consistency
    if (boardId === 'timeline-board') {
      const headPost = (quest as any).headPost as Post | undefined;
      const postLike = headPost ?? ({
        id: quest.headPostId,
        type: 'quest',
        authorId: quest.authorId,
        content: quest.title,
        visibility: 'public',
        timestamp: quest.createdAt || '',
        tags: [],
        collaborators: [],
        linkedItems: [],
      } as Post);

      return (
        <PostCard
          post={postLike}
          questId={quest.id}
          questTitle={quest.title}
          {...sharedProps}
        />
      );
    }

    return (
      <QuestCard
        quest={quest}
        user={user}
        compact={compact}
        onEdit={onEdit ? () => onEdit(quest.id) : undefined}
        onDelete={onDelete ? (q) => onDelete(q.id) : undefined}
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
