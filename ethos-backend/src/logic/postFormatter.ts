import { Post } from '../types/api';
import { EnrichedPost } from '../types/enriched';
import { canEditPost, canCommentOnPost, canViewPost } from './permissionUtils';

/**
 * Adds display hints and user actions to a post for frontend logic.
 * 
 * @param post - The raw post object.
 * @param currentUserId - The current user’s ID (optional).
 * @returns The formatted enriched post or null if invalid.
 */
export const formatPost = (
  post: Post,
  currentUserId: string | null = null
): EnrichedPost | null => {
  if (!post || typeof post !== 'object') return null;

  return {
    ...post,
    editable: canEditPost(post, currentUserId),
    isLinked: !!post.questId,
    displayHints: {
      isPublic: post.visibility === 'public',
      isRequest: post.type === 'request',
      isQuestLog: post.type === 'log',
    },
    userActions: {
      canEdit: canEditPost(post, currentUserId),
      canComment: canCommentOnPost(post, currentUserId),
      canView: canViewPost(post, currentUserId),
    },
  } as EnrichedPost;
};

/**
 * Applies `formatPost` to a list of posts.
 * 
 * @param posts - Array of post objects.
 * @param currentUserId - The current user’s ID.
 * @returns List of formatted enriched post objects.
 */
export const formatPosts = (
  posts: Post[] = [],
  currentUserId: string | null = null
): EnrichedPost[] => {
  return posts.map((p) => formatPost(p, currentUserId)).filter(Boolean) as EnrichedPost[];
};