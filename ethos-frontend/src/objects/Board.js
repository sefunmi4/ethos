// objects/Board.js

import Contribution from './Contribution.js';
import Post from './Post.js';
import Quest from './Quest.js';
import Project from './Project.js';

export default class Board {
  constructor({
    id,
    authorId,
    title = '',
    description = '',
    visibility = 'public',
    layout = 'grid', // default rendering type
    items = [], // an array of Contributions
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString(),
    tags = [],
    metadata = {},
  }) {
    this.id = id;
    this.authorId = authorId;
    this.title = title;
    this.description = description;
    this.visibility = visibility;
    this.layout = layout;
    this.items = items;
    this.tags = tags;
    this.metadata = metadata;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /** Add a contribution item (Post, Quest, Project) */
  addItem(contribution) {
    if (!(contribution instanceof Contribution)) {
      throw new Error('Item must extend Contribution');
    }
    this.items.push(contribution);
    this.updatedAt = new Date().toISOString();
  }

  /** Remove an item by ID */
  removeItemById(id) {
    this.items = this.items.filter((item) => item.id !== id);
    this.updatedAt = new Date().toISOString();
  }

  /** Determine default or fallback render structure */
  getStructureType() {
    if (this.items.length === 1) {
      // Single item fallback rendering
      return this.items[0].getStructureType?.() || 'single';
    }

    if (this.layout) return this.layout;

    const types = this.items.map((item) => item.type);

    if (types.every((t) => t === 'post')) return 'thread';
    if (types.includes('quest')) return 'quest_map';
    if (types.includes('project')) return 'journey';

    return 'grid'; // default
  }

  /** Return all items grouped by type */
  groupByType() {
    const groups = {
      post: [],
      quest: [],
      project: [],
      unknown: [],
    };

    this.items.forEach((item) => {
      if (item instanceof Project) groups.project.push(item);
      else if (item instanceof Quest) groups.quest.push(item);
      else if (item instanceof Post) groups.post.push(item);
      else groups.unknown.push(item);
    });

    return groups;
  }

  /** Get latest modified item */
  getLastUpdatedItem() {
    return [...this.items].sort(
      (a, b) => new Date(b.updatedAt || b.timestamp) - new Date(a.updatedAt || a.timestamp)
    )[0];
  }

  /** Export to JSON */
  toJSON() {
    return {
      id: this.id,
      authorId: this.authorId,
      title: this.title,
      description: this.description,
      visibility: this.visibility,
      layout: this.layout,
      tags: this.tags,
      metadata: this.metadata,
      items: this.items.map((i) => i.toJSON?.() || i),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /** Static loader for reconstructing from JSON */
  static fromJSON(json) {
    const board = new Board({ ...json, items: [] });

    if (Array.isArray(json.items)) {
      board.items = json.items.map((raw) => {
        switch (raw.type) {
          case 'post':
            return Post.fromJSON?.(raw) || raw;
          case 'quest':
            return Quest.fromJSON?.(raw) || raw;
          case 'project':
            return Project.fromJSON?.(raw) || raw;
          default:
            return raw;
        }
      });
    }

    return board;
  }
}