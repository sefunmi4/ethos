// src/utils/loader.ts

import fs from 'fs';
import path from 'path';

export class JsonStore<T> {
  private filePath: string;

  constructor(relativePath: string) {
    this.filePath = path.resolve(process.cwd(), relativePath);
  }

  read(): T[] {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data || '[]') as T[];
    } catch (err) {
      console.error(`[JsonStore] Failed to read ${this.filePath}`, err);
      return [];
    }
  }

  write(data: T[]): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`[JsonStore] Failed to write ${this.filePath}`, err);
    }
  }

  merge(newData: T[], mergeFn: (oldData: T[], newData: T[]) => T[] = (old, incoming) => [...old, ...incoming]): T[] {
    const current = this.read();
    const merged = mergeFn(current, newData);
    this.write(merged);
    return merged;
  }

  delete(filterFn: (item: T) => boolean): T[] {
    const data = this.read();
    const filtered = data.filter(item => !filterFn(item));
    this.write(filtered);
    return filtered;
  }
}