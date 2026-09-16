import type { SeriesType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

const MAX_TAGS = 20;

export type SyncAssociationsInput = {
  tagNames: string[];
  characterName: string | null;
  seriesName: string | null;
  seriesType: SeriesType;
  categoryIds: string[];
};

/**
 * Sets a media item's tags/character/series/categories to exactly the given
 * set (not a diff/append). New tag/character/series names are created
 * directly (find-or-create by slug) — see PLAN.md §12 for why this isn't
 * routed through the suggestion-queue tables yet.
 *
 * No permission check here by design — callers (the upload route, creating
 * its own just-created media; the post-upload edit action, checking
 * ownership/role first) are responsible for deciding who may call this.
 */
export async function syncMediaAssociations(mediaId: string, input: SyncAssociationsInput): Promise<void> {
  const tagNames = Array.from(
    new Set(
      input.tagNames
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, MAX_TAGS)
    )
  );

  const tagIds: string[] = [];
  for (const name of tagNames) {
    const slug = slugify(name);
    if (!slug) continue;
    const tag = await prisma.tag.upsert({ where: { slug }, update: {}, create: { name, slug } });
    tagIds.push(tag.id);
  }

  let seriesId: string | null = null;
  const seriesName = input.seriesName?.trim();
  if (seriesName) {
    const slug = slugify(seriesName);
    if (slug) {
      const series = await prisma.series.upsert({
        where: { slug },
        update: {},
        create: { name: seriesName, slug, type: input.seriesType },
      });
      seriesId = series.id;
    }
  }

  // Series resolved first so a brand-new character picks up the same
  // upload's series at creation time. Never overwrites an *existing*
  // character's series (update: {} is a deliberate no-op) — a later upload
  // shouldn't silently reassign a character someone already curated.
  let characterId: string | null = null;
  const characterName = input.characterName?.trim();
  if (characterName) {
    const slug = slugify(characterName);
    if (slug) {
      const character = await prisma.character.upsert({
        where: { slug },
        update: {},
        create: { name: characterName, slug, seriesId },
      });
      characterId = character.id;
    }
  }

  const previousTagIds = (await prisma.mediaTag.findMany({ where: { mediaId }, select: { tagId: true } })).map(
    (r) => r.tagId
  );
  const affectedTagIds = Array.from(new Set([...previousTagIds, ...tagIds]));

  await prisma.$transaction([
    prisma.mediaCategory.deleteMany({ where: { mediaId } }),
    prisma.mediaCategory.createMany({
      data: input.categoryIds.map((categoryId) => ({ mediaId, categoryId })),
      skipDuplicates: true,
    }),
    prisma.mediaTag.deleteMany({ where: { mediaId } }),
    prisma.mediaTag.createMany({ data: tagIds.map((tagId) => ({ mediaId, tagId })), skipDuplicates: true }),
    prisma.mediaCharacter.deleteMany({ where: { mediaId } }),
    ...(characterId ? [prisma.mediaCharacter.create({ data: { mediaId, characterId } })] : []),
    prisma.mediaSeries.deleteMany({ where: { mediaId } }),
    ...(seriesId ? [prisma.mediaSeries.create({ data: { mediaId, seriesId } })] : []),
  ]);

  for (const tagId of affectedTagIds) {
    const count = await prisma.mediaTag.count({ where: { tagId } });
    await prisma.tag.update({ where: { id: tagId }, data: { usageCount: count } });
  }
}
