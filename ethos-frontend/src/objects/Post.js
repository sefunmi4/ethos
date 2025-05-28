// objects/Post.js

import Contribution from './Contribution.js';

export default class Post extends Contribution {
  constructor({
    id,
    authorId,
    content,
    visibility,
    timestamp,
    tags = [],
    collaborators = [],
    metadata = {},
    type = 'free_speech',
    parentId = null,
    questId = null,
    thread = [],
  }) {
    super({
      id,
      authorId,
      content,
      visibility,
      timestamp,
      tags,
      collaborators,
      metadata,
    });

    this.type = type; // 'free_speech', 'request', 'quest_log', 'quest_task'
    this.parentId = parentId; // If part of a thread
    this.questId = questId;   // If tied to a quest
    this.thread = thread;     // Array of reply Post instances
  }

  /**
   * Add a reply to this post (used for threaded conversations)
   */
  addReply(replyPost) {
    if (!(replyPost instanceof Post)) {
      throw new Error('Replies must be instances of Post');
    }
    this.thread.push(replyPost);
  }

  /**
   * Returns true if this post is part of a thread
   */
  isThreaded() {
    return !!this.parentId || this.thread.length > 0;
  }

  /**
   * Render structure type for boards or fallback logic
   */
  getStructureType() {
    if (this.isThreaded()) return 'thread';
    if (this.type === 'quest_log') return 'timeline';
    return 'card'; // default post layout
  }

  /**
   * Serialize post with thread (deep)
   */
  toJSON() {
    return {
      ...super.toJSON(),
      type: this.type,
      parentId: this.parentId,
      questId: this.questId,
      thread: this.thread.map((reply) => reply.toJSON()),
    };
  }

  /**
   * Load from JSON
   */
  static fromJSON(json) {
    const post = new Post({ ...json, thread: [] });
    if (Array.isArray(json.thread)) {
      post.thread = json.thread.map(Post.fromJSON);
    }
    return post;
  }
}