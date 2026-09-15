import { prisma } from "@/lib/prisma";

const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Records a view if this viewer (by user id or anon cookie id) hasn't
 * already viewed this media in the dedupe window, and bumps the
 * denormalized counter in the same transaction. Silently no-ops for
 * unpublished media, self-views, or an already-recorded view — this is a
 * background bookkeeping operation, not something the caller should have to
 * branch on.
 */
export async function recordView(mediaId: string, viewer: { userId: string | null; anonId: string | null }): Promise<void> {
  if (!viewer.userId && !viewer.anonId) return;

  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { uploaderId: true, status: true, deletedAt: true },
  });
  if (!media || media.status !== "PUBLISHED" || media.deletedAt) return;
  if (viewer.userId && media.uploaderId === viewer.userId) return;

  const since = new Date(Date.now() - DEDUPE_WINDOW_MS);
  const existing = await prisma.viewEvent.findFirst({
    where: {
      mediaId,
      createdAt: { gte: since },
      ...(viewer.userId ? { userId: viewer.userId } : { anonHash: viewer.anonId }),
    },
    select: { id: true },
  });
  if (existing) return;

  await prisma.$transaction([
    prisma.viewEvent.create({
      data: { mediaId, userId: viewer.userId, anonHash: viewer.userId ? null : viewer.anonId },
    }),
    prisma.media.update({ where: { id: mediaId }, data: { viewCount: { increment: 1 } } }),
  ]);
}
