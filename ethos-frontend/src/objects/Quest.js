// objects/Quest.js

import Post from './Post.js';

export default class Quest extends Post {
  constructor({
    id,
    authorId,
    content,
    visibility,
    timestamp,
    title,
    tags = [],
    collaborators = [],
    metadata = {},
    parentId = null,
    thread = [],
    tasks = [],
    logs = [],
    state = 'active', // 'draft', 'active', 'completed', 'archived'
    projectId = null,
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
      type: 'quest_log',
      parentId,
      questId: id,
      thread,
    });

    this.title = title || 'Untitled Quest';
    this.tasks = tasks; // array of Post or derived QuestTask objects
    this.logs = logs;   // array of Post (quest logs / updates)
    this.state = state;
    this.projectId = projectId; // optional linkage to a parent Project
  }

  /** Add a quest task */
  addTask(task) {
    if (!(task instanceof Post)) {
      throw new Error('Tasks must be Post instances');
    }
    this.tasks.push(task);
  }

  /** Add a log entry */
  addLog(log) {
    if (!(log instanceof Post)) {
      throw new Error('Logs must be Post instances');
    }
    this.logs.push(log);
  }

  /** Update quest state */
  setState(newState) {
    const valid = ['draft', 'active', 'completed', 'archived'];
    if (!valid.includes(newState)) throw new Error('Invalid quest state');
    this.state = newState;
  }

  /** Return structure type for UI */
  getStructureType() {
    return 'timeline'; // preferred layout for quest logs
  }

  /** JSON export */
  toJSON() {
    return {
      ...super.toJSON(),
      title: this.title,
      tasks: this.tasks.map((t) => t.toJSON()),
      logs: this.logs.map((l) => l.toJSON()),
      state: this.state,
      projectId: this.projectId,
    };
  }

  /** Load from JSON */
  static fromJSON(json) {
    const quest = new Quest({
      ...json,
      tasks: [],
      logs: [],
    });

    if (Array.isArray(json.tasks)) {
      quest.tasks = json.tasks.map(Post.fromJSON);
    }

    if (Array.isArray(json.logs)) {
      quest.logs = json.logs.map(Post.fromJSON);
    }

    return quest;
  }

  /** Return quest status indicator for UI badges */
  getStatusTag() {
    switch (this.state) {
      case 'draft':
        return { color: 'gray', label: 'Draft' };
      case 'active':
        return { color: 'blue', label: 'Active' };
      case 'completed':
        return { color: 'green', label: 'Completed' };
      case 'archived':
        return { color: 'red', label: 'Archived' };
      default:
        return { color: 'gray', label: 'Unknown' };
    }
  }
}