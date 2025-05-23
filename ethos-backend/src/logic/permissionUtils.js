// permissionUtils.js

/**
 * Utility for checking permission logic on posts and quests
 */

export const canEditPost = (post, userId) => {
    if (!post || !userId) return false;
    return post.authorId === userId || (post.type === 'quest_log' && post.collaborators?.includes(userId));
  };
  
  export const canCommentOnPost = (post, userId) => {
    if (!post || !userId) return false;
    if (post.visibility === 'public') return true;
    return post.authorId === userId || post.collaborators?.includes(userId);
  };
  
  export const canViewPost = (post, userId) => {
    if (!post) return false;
    if (post.visibility === 'public') return true;
    return post.authorId === userId || post.collaborators?.includes(userId);
  };
  
  export const canEditQuest = (quest, userId) => {
    if (!quest || !userId) return false;
    return quest.authorId === userId || quest.collaborators?.includes(userId);
  };
  
  export const canJoinQuest = (quest, userId) => {
    if (!quest || !userId) return false;
    return !quest.collaborators?.includes(userId);
  };
  
  export const isCollaborator = (resource, userId) => {
    return resource.collaborators?.includes(userId);
  };
  