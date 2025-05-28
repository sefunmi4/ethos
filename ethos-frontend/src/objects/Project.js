// objects/Project.js

import Quest from './Quest.js';
import Post from './Post.js';

export default class Project extends Quest {
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
    logs = [],
    state = 'active',
    journeyMap = [], // Array of quest/post branches forming a journey path
    branches = [],   // Tree structure of quests and posts
  }) {
    super({
      id,
      authorId,
      content,
      visibility,
      timestamp,
      title,
      tags,
      collaborators,
      metadata,
      logs,
      state,
      tasks: [], // Not directly used in Project, but still valid
    });

    this.type = 'project';
    this.journeyMap = journeyMap;
    this.branches = branches;
  }

  /** Add a new branch (quest or post) to the journey */
  addBranch(node) {
    if (!(node instanceof Post)) {
      throw new Error('Branch node must extend Post');
    }
    this.branches.push(node);
  }

  /** Link a quest or post into the journey map path */
  addToJourneyPath(nodeId, parentId = null) {
    this.journeyMap.push({ nodeId, parentId });
  }

  /** Flatten the journey for timeline or summary views */
  getJourneyTimeline() {
    return this.journeyMap.map(({ nodeId, parentId }) => {
      return {
        node: this.findNodeById(nodeId),
        parent: this.findNodeById(parentId),
      };
    });
  }

  /** Search for a node by ID in branches */
  findNodeById(id) {
    return this.branches.find((node) => node.id === id) || null;
  }

  /** Rendering structure type: journey or fallback */
  getStructureType() {
    return this.branches.length > 1 ? 'journey' : super.getStructureType();
  }

  /** Return display status for UI */
  getStatusTag() {
    switch (this.state) {
      case 'active':
        return { color: 'purple', label: 'In Progress' };
      case 'completed':
        return { color: 'green', label: 'Done' };
      case 'archived':
        return { color: 'gray', label: 'Archived' };
      default:
        return { color: 'blue', label: 'Project' };
    }
  }

  /** Export to JSON */
  toJSON() {
    return {
      ...super.toJSON(),
      type: 'project',
      journeyMap: this.journeyMap,
      branches: this.branches.map((b) => b.toJSON()),
    };
  }

  /** Static load method */
  static fromJSON(json) {
    const project = new Project({
      ...json,
      branches: [],
      journeyMap: json.journeyMap || [],
    });

    if (Array.isArray(json.branches)) {
      project.branches = json.branches.map((b) => Post.fromJSON(b));
    }

    return project;
  }
}