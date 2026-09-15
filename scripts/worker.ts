import "dotenv/config";
import { PgBoss } from "pg-boss";
import { QUEUE_PROCESS_MEDIA } from "../src/lib/media/queue";
import { processMedia } from "../src/lib/media/process";
import { recomputeTrendingScores } from "../src/lib/media/trending";
import { prisma } from "../src/lib/prisma";

const QUEUE_RECOMPUTE_TRENDING = "recompute-trending";

async function main() {
  const boss = new PgBoss({ connectionString: process.env.DATABASE_URL });

  boss.on("error", (err) => console.error("[worker] pg-boss error:", err));

  await boss.start();
  await boss.createQueue(QUEUE_PROCESS_MEDIA);
  await boss.createQueue(QUEUE_RECOMPUTE_TRENDING);

  await boss.work<{ mediaId: string }>(QUEUE_PROCESS_MEDIA, async ([job]) => {
    console.log(`[worker] processing media ${job.data.mediaId}`);
    try {
      await processMedia(job.data.mediaId);
      console.log(`[worker] published media ${job.data.mediaId}`);
    } catch (err) {
      console.error(`[worker] failed to process media ${job.data.mediaId}:`, err);
      throw err;
    }
  });

  await boss.work(QUEUE_RECOMPUTE_TRENDING, async () => {
    await recomputeTrendingScores();
    console.log("[worker] recomputed trending scores");
  });

  // Every 5 minutes, per the plan's "recomputed periodically, not on every request".
  await boss.schedule(QUEUE_RECOMPUTE_TRENDING, "*/5 * * * *");
  // Run once immediately on boot so scores aren't all zero until the first tick.
  await boss.send(QUEUE_RECOMPUTE_TRENDING, {});

  console.log("[worker] listening for media processing jobs");

  const shutdown = async () => {
    console.log("[worker] shutting down");
    await boss.stop();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[worker] fatal error:", err);
  process.exit(1);
});
