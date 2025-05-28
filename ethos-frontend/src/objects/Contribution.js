// objects/Contribution.js

import { v4 as uuidv4 } from 'uuid';

export default class Contribution {
  constructor({
    id = `c_${uuidv4()}`,
    authorId,
    content = '',
    visibility = 'public',
    timestamp = new Date().toISOString(),
    tags = [],
    collaborators = [],
    metadata = {}
  }) {
    this.id = id;
    this.authorId = authorId;
    this.content = content;
    this.visibility = visibility;
    this.timestamp = timestamp;
    this.tags = tags;
    this.collaborators = collaborators;
    this.metadata = metadata;
  }

  /**
   * Update contribution fields
   */
  update(fields = {}) {
    Object.assign(this, fields);
    this.timestamp = new Date().toISOString(); // Update modification timestamp
  }

  /**
   * Return a simplified summary of this contribution
   */
  summarize() {
    return {
      id: this.id,
      authorId: this.authorId,
      content: this.content.slice(0, 140),
      visibility: this.visibility,
      timestamp: this.timestamp,
    };
  }

  /**
   * Serialize contribution to JSON
   */
  toJSON() {
    return {
      id: this.id,
      authorId: this.authorId,
      content: this.content,
      visibility: this.visibility,
      timestamp: this.timestamp,
      tags: this.tags,
      collaborators: this.collaborators,
      metadata: this.metadata
    };
  }

  /**
   * Create an instance from raw JSON
   */
  static fromJSON(json) {
    return new Contribution(json);
  }
}