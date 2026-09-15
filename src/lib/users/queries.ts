import { prisma } from "@/lib/prisma";

export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username, deletedAt: null },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      websiteUrl: true,
      twitterHandle: true,
      createdAt: true,
      _count: { select: { media: true, followedBy: true, following: true } },
    },
  });
}

export async function isFollowing(followerId: string | null, followingId: string): Promise<boolean> {
  if (!followerId) return false;
  const row = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId, followingId } } });
  return Boolean(row);
}

/** A user's most-used tags across their own published uploads. */
export async function getMostUsedTags(userId: string, take = 8) {
  const grouped = await prisma.mediaTag.groupBy({
    by: ["tagId"],
    where: { media: { uploaderId: userId, status: "PUBLISHED", deletedAt: null } },
    _count: { tagId: true },
    orderBy: { _count: { tagId: "desc" } },
    take,
  });
  if (grouped.length === 0) return [];

  const tags = await prisma.tag.findMany({ where: { id: { in: grouped.map((g) => g.tagId) } } });
  const order = new Map(grouped.map((g, i) => [g.tagId, i]));
  return tags.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function searchUsers(q: string, take = 12) {
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      username: { not: null },
      OR: [{ name: { contains: q, mode: "insensitive" } }, { username: { contains: q, mode: "insensitive" } }],
    },
    select: { id: true, name: true, username: true, image: true },
    take,
  });
}
