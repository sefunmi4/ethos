"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPosts = exports.formatPost = void 0;
const permissionUtils_1 = require("./permissionUtils");
/**
 * Adds display hints and user actions to a post for frontend logic.
 *
 * @param post - The raw post object.
 * @param currentUserId - The current user’s ID (optional).
 * @returns The formatted enriched post or null if invalid.
 */
const formatPost = (post, currentUserId = null) => {
    if (!post || typeof post !== 'object')
        return null;
    return {
        ...post,
        editable: (0, permissionUtils_1.canEditPost)(post, currentUserId),
        isLinked: !!post.questId,
        displayHints: {
            isPublic: post.visibility === 'public',
            isRequest: post.type === 'request',
            isQuestLog: post.type === 'log',
        },
        userActions: {
            canEdit: (0, permissionUtils_1.canEditPost)(post, currentUserId),
            canComment: (0, permissionUtils_1.canCommentOnPost)(post, currentUserId),
            canView: (0, permissionUtils_1.canViewPost)(post, currentUserId),
        },
    };
};
exports.formatPost = formatPost;
/**
 * Applies `formatPost` to a list of posts.
 *
 * @param posts - Array of post objects.
 * @param currentUserId - The current user’s ID.
 * @returns List of formatted enriched post objects.
 */
const formatPosts = (posts = [], currentUserId = null) => {
    return posts.map((p) => (0, exports.formatPost)(p, currentUserId)).filter(Boolean);
};
exports.formatPosts = formatPosts;
