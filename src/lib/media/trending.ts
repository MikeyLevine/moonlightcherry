import { prisma } from "@/lib/prisma";

// PLAN.md §11: score = (likes*w_like + favorites*w_fav + comments*w_comment) / (age_hours + 2)^gravity.
// Weights are tuning parameters (explicitly an open decision, §20.10) — these are a
// conservative starting point, not a final answer.
const W_LIKE = 1;
const W_FAVORITE = 2;
const W_COMMENT = 3;
const GRAVITY = 1.5;

/**
 * Recomputes trendingScore for all published media. Run periodically by the
 * worker (see scripts/worker.ts) — never on the request path, per the plan's
 * performance requirements.
 */
export async function recomputeTrendingScores(): Promise<number> {
  return prisma.$executeRaw`
    UPDATE media
    SET "trendingScore" = (
      "likeCount" * ${W_LIKE} + "favoriteCount" * ${W_FAVORITE} + "commentCount" * ${W_COMMENT}
    ) / POWER(EXTRACT(EPOCH FROM (NOW() - "createdAt")) / 3600.0 + 2, ${GRAVITY})
    WHERE status = 'PUBLISHED' AND "deletedAt" IS NULL
  `;
}
