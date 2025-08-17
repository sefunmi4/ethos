import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Counter, Pushgateway, Registry } from 'prom-client';

const backendDir = path.join(__dirname, '..');
const migrationsDir = path.join(backendDir, 'prisma', 'migrations');

const registry = new Registry();
const rollbackSuccess = new Counter({
  name: 'migration_rollback_success_total',
  help: 'Number of successful migration rollbacks',
  registers: [registry],
});
const rollbackFailure = new Counter({
  name: 'migration_rollback_failure_total',
  help: 'Number of failed migration rollback attempts',
  registers: [registry],
});
const gateway = new Pushgateway(
  process.env.PUSHGATEWAY_URL ?? 'http://localhost:9091',
  [],
  registry
);

function getLastMigration(): string | null {
  const dirs = fs
    .readdirSync(migrationsDir)
    .filter((f) => fs.statSync(path.join(migrationsDir, f)).isDirectory())
    .sort();
  if (dirs.length < 1) {
    console.log('No migrations found');
    return null;
  }
  return dirs[dirs.length - 1];
}

async function rollback(): Promise<void> {
  const last = getLastMigration();
  if (!last) return;
  try {
    execSync(`npx prisma migrate resolve --rolled-back ${last}`, {
      cwd: backendDir,
      stdio: 'inherit',
    });
    execSync('npx prisma migrate deploy', { cwd: backendDir, stdio: 'inherit' });
    rollbackSuccess.inc();
    await gateway.pushAdd({ jobName: 'migration_rollback' });
    console.log(`Rolled back migration ${last}`);
  } catch (err) {
    rollbackFailure.inc();
    await gateway.pushAdd({ jobName: 'migration_rollback' });
    console.error(`Failed to roll back migration ${last}`);
    process.exit(1);
  }
}

void rollback();
