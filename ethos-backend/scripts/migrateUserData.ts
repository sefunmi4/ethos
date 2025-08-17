import fs from 'fs';
import path from 'path';
import { normalizeUserPayload } from '../src/utils/payloadTransforms';

interface UserRecord {
  id: string;
  username?: string;
  handle?: string;
  bio?: string;
  about?: string;
}

/**
 * Simple script to migrate user records to the new payload format by
 * translating fields and sending them to the update endpoint.
 */
async function migrate(filePath: string, apiBase = 'http://localhost:3000') {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const users: UserRecord[] = JSON.parse(raw);
  for (const user of users) {
    const payload = normalizeUserPayload(user);
    await fetch(`${apiBase}/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log(`Migrated user ${user.id}`);
  }
}

const file = process.argv[2] || path.join(__dirname, 'users.json');
void migrate(file).catch(err => {
  console.error('Migration failed', err);
  process.exit(1);
});
