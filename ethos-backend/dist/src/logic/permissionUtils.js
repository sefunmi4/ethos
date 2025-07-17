"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCollaborator = exports.canJoinQuest = exports.canEditQuest = exports.canViewPost = exports.canCommentOnPost = exports.canEditPost = void 0;
/**
 * ✅ Can the user edit the post?
 * - Author can always edit
 * - Collaborators can edit quest logs
 */
const canEditPost = (post, userId) => {
    if (!post || !userId)
        return false;
    return (post.authorId === userId ||
        (post.type === 'log' && post.collaborators?.some(c => c.userId === userId)));
};
exports.canEditPost = canEditPost;
/**
 * ✅ Can the user comment on the post?
 * - Public posts are open to all
 * - Otherwise must be author or collaborator
 */
const canCommentOnPost = (post, userId) => {
    if (!post || !userId)
        return false;
    if (post.visibility === 'public')
        return true;
    return (post.authorId === userId || post.collaborators?.some(c => c.userId === userId));
};
exports.canCommentOnPost = canCommentOnPost;
/**
 * ✅ Can the user view the post?
 * - Public is viewable
 * - Otherwise needs to be author or collaborator
 */
const canViewPost = (post, userId) => {
    if (!post)
        return false;
    if (post.visibility === 'public')
        return true;
    if (!userId)
        return false;
    return post.authorId === userId || post.collaborators?.some(c => c.userId === userId);
};
exports.canViewPost = canViewPost;
/**
 * ✅ Can the user edit the quest?
 * - Only owner or collaborator can edit
 */
const canEditQuest = (quest, userId) => {
    if (!quest || !userId)
        return false;
    return quest.authorId === userId || quest.collaborators?.some(c => c.userId === userId);
};
exports.canEditQuest = canEditQuest;
/**
 * ✅ Can the user join the quest?
 * - They must not already be a collaborator
 */
const canJoinQuest = (quest, userId) => {
    if (!quest || !userId)
        return false;
    return !quest.collaborators?.some(c => c.userId === userId);
};
exports.canJoinQuest = canJoinQuest;
/**
 * ✅ Is the user a collaborator on this resource?
 * Works on posts or quests.
 */
const isCollaborator = (resource, userId) => {
    return !!userId && resource.collaborators?.some(c => c.userId === userId) === true;
};
exports.isCollaborator = isCollaborator;
