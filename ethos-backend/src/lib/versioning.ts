import { PrismaClient } from '@prisma/client';

/**
 * Function signature for upgrading a record from a given version to the next.
 */
type UpgradeFn = (record: any, prisma: PrismaClient) => Promise<void>;

/**
 * Upgrade maps for each Prisma model. Keys represent the current version of the
 * record. When a record of that version is encountered, the associated function
 * runs and should mutate it to the next version.
 */
const upgrades: Record<string, Record<number, UpgradeFn>> = {
  post: {},
  quest: {},
  board: {},
  project: {},
  review: {},
  user: {},
  notification: {},
  taskJoinRequest: {},
};

/**
 * Apply any pending upgrades for all configured models. Each model is scanned
 * for records whose `version` field is lower than the latest known version and
 * sequential upgrade functions are executed until the record is up to date.
 */
export async function runVersioning(prisma: PrismaClient): Promise<void> {
  for (const [model, upgradeMap] of Object.entries(upgrades)) {
    const delegate = (prisma as any)[model];
    if (!delegate) continue;

    const latest = Object.keys(upgradeMap).length
      ? Math.max(...Object.keys(upgradeMap).map(Number)) + 1
      : 1;

    const records = await delegate.findMany({
      where: { version: { lt: latest } },
    });

    for (const record of records) {
      let current = record.version ?? 1;
      while (current < latest) {
        const fn = upgradeMap[current];
        if (fn) await fn(record, prisma);
        current++;
      }
      await delegate.update({
        where: { id: record.id },
        data: { version: current },
      });
    }
  }
}

export { upgrades, UpgradeFn };
