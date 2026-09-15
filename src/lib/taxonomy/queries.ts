import { prisma } from "@/lib/prisma";

export async function listTags(options: { take?: number; q?: string | null } = {}) {
  const { take = 100, q = null } = options;
  return prisma.tag.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: [{ usageCount: "desc" }, { name: "asc" }],
    take,
  });
}

export async function getTagBySlug(slug: string) {
  return prisma.tag.findUnique({ where: { slug } });
}

/** Other tags that co-occur with this one on the same media, ranked by how often. */
export async function getRelatedTags(tagId: string, take = 10) {
  const rows = await prisma.mediaTag.findMany({
    where: { tag: { id: tagId }, media: { tags: { some: { tagId } } } },
    select: { mediaId: true },
  });
  const mediaIds = rows.map((r) => r.mediaId);
  if (mediaIds.length === 0) return [];

  const coOccurring = await prisma.mediaTag.groupBy({
    by: ["tagId"],
    where: { mediaId: { in: mediaIds }, tagId: { not: tagId } },
    _count: { tagId: true },
    orderBy: { _count: { tagId: "desc" } },
    take,
  });
  if (coOccurring.length === 0) return [];

  const tags = await prisma.tag.findMany({ where: { id: { in: coOccurring.map((c) => c.tagId) } } });
  const order = new Map(coOccurring.map((c, i) => [c.tagId, i]));
  return tags.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function listCharacters(options: { take?: number; q?: string | null } = {}) {
  const { take = 100, q = null } = options;
  return prisma.character.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    take,
    include: { series: true, _count: { select: { media: true } } },
  });
}

export async function getCharacterBySlug(slug: string) {
  return prisma.character.findUnique({ where: { slug }, include: { series: true } });
}

export async function listSeries(options: { take?: number; q?: string | null } = {}) {
  const { take = 100, q = null } = options;
  return prisma.series.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    take,
    include: { _count: { select: { media: true, characters: true } } },
  });
}

export async function getSeriesBySlug(slug: string) {
  return prisma.series.findUnique({
    where: { slug },
    include: { characters: { orderBy: { name: "asc" } } },
  });
}
