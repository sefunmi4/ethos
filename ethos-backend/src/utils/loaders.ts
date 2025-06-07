// utils/loaders.ts
import fs from 'fs';
import path from 'path';
import type { DataStore } from '../types/db';

export function createDataStore<T>(filename: string): DataStore<T> {
  const filepath = path.join(__dirname, '../data', filename);

  const ensureFile = (): void => {
    if (!fs.existsSync(filepath) || fs.readFileSync(filepath, 'utf-8').trim() === '') {
      fs.writeFileSync(filepath, '[]');
    }
  };

  return {
    read: () => {
      ensureFile();
      try {
        return JSON.parse(fs.readFileSync(filepath, 'utf-8')) as T;
      } catch {
        // If JSON is malformed, reset to an empty array
        fs.writeFileSync(filepath, '[]');
        return [] as unknown as T;
      }
    },
    write: (data) => fs.writeFileSync(filepath, JSON.stringify(data, null, 2)),
    filepath,
  };
}
