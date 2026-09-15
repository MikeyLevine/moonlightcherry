"use server";

import type { SeriesType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

const EDITOR_ROLES = new Set(["MODERATOR", "ADMINISTRATOR", "OWNER"]);
const MAX_TAGS = 20;

type UpdateInput = {
  tagNames: string[];
  characterName: string | null;
  seriesName: string | null;
  seriesType: SeriesType;
  categoryIds: string[];
};

/**
 * Sets a media item's tags/character/series/categories to exactly the given
 * set (not a diff/append) — simplest correct semantics for a form that shows
 * and edits the full current state at once. New tag/character/series names
 * are created directly (find-or-create by slug); there's no admin approval
 * queue yet (Phase 16), so gating creation behind a pending-suggestion state
 * with nothing able to review it would just leave suggestions stuck forever
 * — worse than allowing direct creation for now.
 */
export async function updateMediaAssociations(mediaId: string, input: UpdateInput) {
  const session = await auth();
  if (!session?.user) {
    return { ok: false as const, error: "Sign in to edit this." };
  }

  const media = await prisma.media.findUnique({ where: { id: mediaId }, select: { uploaderId: true } });
  if (!media) {
    return { ok: false as const, error: "Media not found." };
  }

  const canEdit = media.uploaderId === session.user.id || EDITOR_ROLES.has(session.user.role);
  if (!canEdit) {
    return { ok: false as const, error: "You can only edit your own uploads." };
  }

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
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    tagIds.push(tag.id);
  }

  let characterId: string | null = null;
  const characterName = input.characterName?.trim();
  if (characterName) {
    const slug = slugify(characterName);
    if (slug) {
      const character = await prisma.character.upsert({
        where: { slug },
        update: {},
        create: { name: characterName, slug },
      });
      characterId = character.id;
    }
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

  return { ok: true as const };
}
