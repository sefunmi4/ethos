// loaders.js
// JsonStore class for managing safe reads, writes, merges, and deletes

import fs from 'fs';

class JsonStore {
  constructor(path) {
    this.path = path;
  }

  read() {
    try {
      const data = fs.readFileSync(this.path, 'utf8');
      return JSON.parse(data || '[]');
    } catch (err) {
      console.error(`[JsonStore] Failed to read ${this.path}`, err);
      return [];
    }
  }

  write(data) {
    try {
      fs.writeFileSync(this.path, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`[JsonStore] Failed to write ${this.path}`, err);
    }
  }

  merge(newData, mergeFn = (oldData, newData) => [...oldData, ...newData]) {
    const existing = this.read();
    const merged = mergeFn(existing, newData);
    this.write(merged);
    return merged;
  }

  delete(filterFn) {
    const data = this.read();
    const filtered = data.filter((item) => !filterFn(item));
    this.write(filtered);
    return filtered;
  }
}

export const usersStore = new JsonStore('./src/data/users.json');
export const postsStore = new JsonStore('./src/data/posts.json');
export const questsStore = new JsonStore('./src/data/quests.json');
export const projectsStore = new JsonStore('./src/data/projects.json'); 
export const boardsStore = new JsonStore('./src/data/boards.json');
export const collabStore = new JsonStore('./src/data/collab.json');
export const reactionsStore = new JsonStore('./src/data/reactions.json'); 