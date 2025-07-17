// src/components/contribution/ContributionCard.tsx

import React from 'react';
import PostCard from '../post/PostCard';
import QuestCard from '../quest/QuestCard';
import { ErrorBoundary } from '../ui';

import type { Post } from '../../types/postTypes';
import type { Quest, EnrichedQuest } from '../../types/questTypes';
import type { BoardData } from '../../types/boardTypes';
import type { User } from '../../types/userTypes';

type Contribution = Post | EnrichedQuest | BoardData;

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
  /** Whether this card is expanded */
  expanded?: boolean;
  /** Callback when expansion toggled */
  onToggleExpand?: () => void;
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
  expanded,
  onToggleExpand,
}) => {
  if (!contribution) return null;

  const { id } = contribution;

  if (!id) {
    console.warn('[ContributionCard] Missing `id` on contribution:', contribution);
    return null;
  }

  const sharedProps = {
    user,
    compact,
    onEdit,
    onDelete,
    showStatusControl,
    headerOnly,
    initialShowReplies,
    boardId,
    expanded,
    onToggleExpand,
  };

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
    const quest = contribution as EnrichedQuest;

    // Display quests on timeline and post history boards like regular posts for consistency
    if (boardId === 'timeline-board' || boardId === 'my-posts') {
      const headPost = quest.headPost as Post | undefined;
      const enrichedHeadPost = headPost
        ? {
            ...headPost,
            author:
              headPost.author ||
              (quest.author
                ? { id: quest.author.id, username: quest.author.username }
                : undefined),
          }
        : undefined;
      const postLike = enrichedHeadPost ?? ({
        id: quest.headPostId,
        type: 'quest',
        authorId: quest.authorId,
        author: quest.author
          ? { id: quest.author.id, username: quest.author.username }
          : undefined,
        content: quest.title,
        visibility: 'public',
        timestamp: quest.createdAt || '',
        tags: [],
        collaborators: [],
        linkedItems: [],
        questId: quest.id,
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
      <ErrorBoundary>
        <QuestCard
          quest={quest}
          user={user}
          compact={compact}
          expanded={expanded}
          onToggleExpand={onToggleExpand}
          onEdit={onEdit ? () => onEdit(quest.id) : undefined}
          onDelete={onDelete ? (q) => onDelete(q.id) : undefined}
        />
      </ErrorBoundary>
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
