import { Post, Quest } from '../types/api';
import { UUID } from '../types/api';

/**
 * ✅ Can the user edit the post?
 * - Author can always edit
 * - Collaborators can edit quest logs
 */
export const canEditPost = (post: Post, userId: UUID | null): boolean => {
  if (!post || !userId) return false;
  return (
    post.authorId === userId ||
    (post.type === 'quest_log' && !!post.collaborators?.includes(userId))
  );
};

/**
 * ✅ Can the user comment on the post?
 * - Public posts are open to all
 * - Otherwise must be author or collaborator
 */
export const canCommentOnPost = (post: Post, userId: UUID | null): boolean => {
  if (!post || !userId) return false;
  if (post.visibility === 'public') return true;
  return (
    post.authorId === userId || !!post.collaborators?.includes(userId)
  );
};

/**
 * ✅ Can the user view the post?
 * - Public is viewable
 * - Otherwise needs to be author or collaborator
 */
export const canViewPost = (post: Post, userId: UUID | null): boolean => {
  if (!post) return false;
  if (post.visibility === 'public') return true;
  if (!userId) return false;

  return post.authorId === userId || !!post.collaborators?.includes(userId);
};

/**
 * ✅ Can the user edit the quest?
 * - Only owner or collaborator can edit
 */
export const canEditQuest = (quest: Quest, userId: UUID | null): boolean => {
  if (!quest || !userId) return false;
  return (
    quest.ownerId === userId || !!quest.collaborators?.includes(userId)
  );
};

/**
 * ✅ Can the user join the quest?
 * - They must not already be a collaborator
 */
export const canJoinQuest = (quest: Quest, userId: UUID | null): boolean => {
  if (!quest || !userId) return false;
  return !quest.collaborators?.includes(userId);
};

/**
 * ✅ Is the user a collaborator on this resource?
 * Works on posts or quests.
 */
export const isCollaborator = (
  resource: { collaborators?: UUID[] },
  userId: UUID | null
): boolean => {
  return !!userId && !!resource.collaborators?.includes(userId);
};