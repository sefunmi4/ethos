// utils/loaders.ts
import fs from 'fs';
import path from 'path';
import type { DataStore } from '../types/db';

export function createDataStore<T>(filename: string): DataStore<T> {
  const filepath = path.join(__dirname, '../data', filename);

  return {
    read: () => JSON.parse(fs.readFileSync(filepath, 'utf-8')) as T,
    write: (data) => fs.writeFileSync(filepath, JSON.stringify(data, null, 2)),
    filepath,
  };
}
