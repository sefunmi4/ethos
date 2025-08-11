// utils/loaders.ts
import fs from 'fs';
import path from 'path';
import type { DataStore } from '../types/db';

export function createDataStore<T>(filename: string, defaultData: T): DataStore<T> {
  const filepath = path.join(__dirname, '../data', filename);
  const directory = path.dirname(filepath);

  const ensureDir = (): void => {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  };

  return {
    read: () => {
      try {
        ensureDir();
        if (!fs.existsSync(filepath)) {
          fs.writeFileSync(filepath, JSON.stringify(defaultData, null, 2));
          return defaultData;
        }
        const contents = fs.readFileSync(filepath, 'utf-8');
        if (!contents.trim()) {
          fs.writeFileSync(filepath, JSON.stringify(defaultData, null, 2));
          return defaultData;
        }
        return JSON.parse(contents) as T;
      } catch {
        return defaultData;
      }
    },
    write: (data) => {
      ensureDir();
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    },
    filepath,
  };
}
