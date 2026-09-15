"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function toggleLike(mediaId: string) {
  const session = await auth();
  if (!session?.user) {
    return { ok: false as const, error: "Sign in to like this." };
  }
  const userId = session.user.id;

  const existing = await prisma.like.findUnique({ where: { userId_mediaId: { userId, mediaId } } });

  if (existing) {
    const [, media] = await prisma.$transaction([
      prisma.like.delete({ where: { id: existing.id } }),
      prisma.media.update({ where: { id: mediaId }, data: { likeCount: { decrement: 1 } }, select: { likeCount: true } }),
    ]);
    return { ok: true as const, active: false, count: media.likeCount };
  }

  const [, media] = await prisma.$transaction([
    prisma.like.create({ data: { userId, mediaId } }),
    prisma.media.update({ where: { id: mediaId }, data: { likeCount: { increment: 1 } }, select: { likeCount: true } }),
  ]);
  return { ok: true as const, active: true, count: media.likeCount };
}

export async function toggleFavorite(mediaId: string) {
  const session = await auth();
  if (!session?.user) {
    return { ok: false as const, error: "Sign in to favorite this." };
  }
  const userId = session.user.id;

  const existing = await prisma.favorite.findUnique({ where: { userId_mediaId: { userId, mediaId } } });

  if (existing) {
    const [, media] = await prisma.$transaction([
      prisma.favorite.delete({ where: { id: existing.id } }),
      prisma.media.update({ where: { id: mediaId }, data: { favoriteCount: { decrement: 1 } }, select: { favoriteCount: true } }),
    ]);
    return { ok: true as const, active: false, count: media.favoriteCount };
  }

  const [, media] = await prisma.$transaction([
    prisma.favorite.create({ data: { userId, mediaId } }),
    prisma.media.update({ where: { id: mediaId }, data: { favoriteCount: { increment: 1 } }, select: { favoriteCount: true } }),
  ]);
  return { ok: true as const, active: true, count: media.favoriteCount };
}
