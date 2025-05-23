// postFormatter.js

import { canEditPost, canCommentOnPost, canViewPost } from './permissionUtils.js';

/**
 * Enrich a post object with user-specific permissions and display hints
 */
export const formatPost = (post, currentUserId) => {
  if (!post) return null;

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
    }
  };
};

/**
 * Format an array of posts
 */
export const formatPosts = (posts = [], currentUserId) => {
  return posts.map(p => formatPost(p, currentUserId));
};
