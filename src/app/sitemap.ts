import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

const STATIC_ROUTES = ["", "/gallery", "/search", "/tags", "/characters", "/anime", "/about", "/contact", "/terms", "/privacy"];

// A single flat sitemap is fine at today's scale. Revisit with Next's
// generateSitemaps (paginated sitemaps) once media/tag counts make one
// request expensive — not worth the complexity pre-emptively.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();

  const [media, tags, characters, series] = await Promise.all([
    prisma.media.findMany({
      where: { status: "PUBLISHED", deletedAt: null, nsfw: false },
      select: { id: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
      take: 5000,
    }),
    prisma.tag.findMany({ select: { slug: true } }),
    prisma.character.findMany({ select: { slug: true } }),
    prisma.series.findMany({ select: { slug: true } }),
  ]);

  return [
    ...STATIC_ROUTES.map((path) => ({ url: `${site}${path}`, changeFrequency: "daily" as const })),
    ...media.map((m) => ({ url: `${site}/i/${m.id}`, lastModified: m.updatedAt, changeFrequency: "weekly" as const })),
    ...tags.map((t) => ({ url: `${site}/tags/${t.slug}`, changeFrequency: "daily" as const })),
    ...characters.map((c) => ({ url: `${site}/characters/${c.slug}`, changeFrequency: "weekly" as const })),
    ...series.map((s) => ({ url: `${site}/anime/${s.slug}`, changeFrequency: "weekly" as const })),
  ];
}
