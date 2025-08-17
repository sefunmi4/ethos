import fs from 'fs/promises';
import path from 'path';
import prisma from '../services/prismaClient';
import { info, error } from '../utils/logger';

const LOG_FILE = path.join(process.cwd(), 'migration.log');
const BATCH_SIZE = 100;

async function logToFile(message: string): Promise<void> {
  const timestamp = new Date().toISOString();
  await fs.appendFile(LOG_FILE, `[${timestamp}] ${message}\n`);
}

async function processBatch(offset: number): Promise<boolean> {
  try {
    const records = await prisma.$queryRaw<Array<Record<string, unknown>>>
      `SELECT * FROM legacy_records ORDER BY id LIMIT ${BATCH_SIZE} OFFSET ${offset}`;
    if (records.length === 0) {
      return false;
    }

    for (const record of records) {
      // TODO: Implement actual migration logic for each record
      void record; // placeholder to avoid unused variable
    }

    await logToFile(`Processed batch at offset ${offset} (${records.length} records)`);
    return records.length === BATCH_SIZE;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logToFile(`Error processing batch at offset ${offset}: ${msg}`);
    return false;
  }
}

export async function migrateLegacyData(): Promise<void> {
  let offset = 0;
  let hasMore = true;
  while (hasMore) {
    hasMore = await processBatch(offset);
    offset += BATCH_SIZE;
  }
}

export async function scheduleLegacyDataMigration(): Promise<void> {
  try {
    const { default: cron } = await import('node-cron');
    // Run at the top of every hour
    cron.schedule('0 * * * *', async () => {
      info('Starting legacy data migration');
      try {
        await migrateLegacyData();
        migrationSuccess.inc();
        await gateway.pushAdd({ jobName: 'legacy_data_migration' });
        info('Legacy data migration completed');
      } catch (err) {
        migrationFailure.inc();
        await gateway.pushAdd({ jobName: 'legacy_data_migration' });
        error('Legacy data migration failed', err);
      }
    });
  } catch (err) {
    info('Legacy data migration scheduler not initialized', err);
  }
}
