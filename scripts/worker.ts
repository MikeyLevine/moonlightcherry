import "dotenv/config";
import { PgBoss } from "pg-boss";
import { QUEUE_PROCESS_MEDIA } from "../src/lib/media/queue";
import { processMedia } from "../src/lib/media/process";
import { prisma } from "../src/lib/prisma";

async function main() {
  const boss = new PgBoss({ connectionString: process.env.DATABASE_URL });

  boss.on("error", (err) => console.error("[worker] pg-boss error:", err));

  await boss.start();
  await boss.createQueue(QUEUE_PROCESS_MEDIA);

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
