import { PgBoss } from "pg-boss";

export const QUEUE_PROCESS_MEDIA = "process-media";

const globalForBoss = globalThis as unknown as { boss?: PgBoss; bossStarted?: Promise<void> };

function getBoss(): PgBoss {
  if (!globalForBoss.boss) {
    globalForBoss.boss = new PgBoss({ connectionString: process.env.DATABASE_URL });
  }
  return globalForBoss.boss;
}

async function ensureStarted(): Promise<PgBoss> {
  const boss = getBoss();
  if (!globalForBoss.bossStarted) {
    globalForBoss.bossStarted = boss.start().then(async () => {
      await boss.createQueue(QUEUE_PROCESS_MEDIA);
    });
  }
  await globalForBoss.bossStarted;
  return boss;
}

export async function enqueueProcessMedia(mediaId: string): Promise<void> {
  const boss = await ensureStarted();
  await boss.send(QUEUE_PROCESS_MEDIA, { mediaId });
}
