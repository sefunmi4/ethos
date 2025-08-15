import { newDb } from 'pg-mem';
import { setTestPool, initializeDatabase } from '../src/db';

export async function setupTestDb(): Promise<void> {
  const db = newDb();
  const pg = db.adapters.createPg();
  const pool = new pg.Pool();
  setTestPool(pool);
  await initializeDatabase();
}
