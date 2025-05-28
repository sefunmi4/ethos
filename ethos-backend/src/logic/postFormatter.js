// utils/postFormatter.js

import { canEditPost, canCommentOnPost, canViewPost } from './permissionUtils.js';

/**
 * Adds display hints and user actions to a post for frontend logic.
 * 
 * @param {object} post - The raw post object.
 * @param {string|null} currentUserId - The current user’s ID (optional).
 * @returns {object|null} - The formatted post or null if invalid.
 */
export const formatPost = (post, currentUserId = null) => {
  if (!post || typeof post !== 'object') return null;

  return {
    ...post,
    displayHints: {
      isPublic: post.visibility === 'public',
      isRequest: post.type === 'request',
      isQuestLog: post.type === 'quest_log',
    },
    userActions: {
      canEdit: canEditPost(post, currentUserId),
      canComment: canCommentOnPost(post, currentUserId),
      canView: canViewPost(post, currentUserId),
    },
  };
};

/**
 * Applies `formatPost` to a list of posts.
 * 
 * @param {object[]} posts - Array of post objects.
 * @param {string|null} currentUserId - The current user’s ID.
 * @returns {object[]} - List of formatted post objects.
 */
export const formatPosts = (posts = [], currentUserId = null) => {
  return posts.map(p => formatPost(p, currentUserId)).filter(Boolean);
};