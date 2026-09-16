"use server";

import type { SeriesType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isModerator } from "@/lib/admin/permissions";
import { slugify } from "@/lib/slugify";
import { taxonomyNameSchema } from "@/lib/security/schemas";

async function requireModerator() {
  const session = await auth();
  if (!session?.user || !isModerator(session.user.role)) {
    return { ok: false as const, error: "You don't have permission to do that." };
  }
  return { ok: true as const, session };
}

function parseName(name: string) {
  const parsed = taxonomyNameSchema.safeParse(name);
  if (!parsed.success || !parsed.data.trim()) return null;
  return parsed.data.trim();
}

async function logAudit(actorId: string, action: string, targetType: string, targetId: string) {
  await prisma.auditLog.create({ data: { actorId, action, targetType, targetId } });
}

// ---------------------------------------------------------------- Tags ----

export async function renameTag(tagId: string, name: string) {
  const check = await requireModerator();
  if (!check.ok) return check;

  const cleanName = parseName(name);
  if (!cleanName) return { ok: false as const, error: "Name can't be empty." };
  const slug = slugify(cleanName);
  if (!slug) return { ok: false as const, error: "That name doesn't produce a valid slug." };

  const collision = await prisma.tag.findUnique({ where: { slug } });
  if (collision && collision.id !== tagId) {
    return { ok: false as const, error: "Another tag already has that name — merge them instead." };
  }

  await prisma.tag.update({ where: { id: tagId }, data: { name: cleanName, slug } });
  await logAudit(check.session.user.id, "tag.rename", "tag", tagId);
  return { ok: true as const };
}

export async function mergeTags(sourceId: string, targetId: string) {
  const check = await requireModerator();
  if (!check.ok) return check;
  if (sourceId === targetId) return { ok: false as const, error: "Can't merge a tag into itself." };

  const targetMediaIds = (await prisma.mediaTag.findMany({ where: { tagId: targetId }, select: { mediaId: true } })).map(
    (r) => r.mediaId
  );

  await prisma.$transaction([
    prisma.mediaTag.deleteMany({ where: { tagId: sourceId, mediaId: { in: targetMediaIds } } }),
    prisma.mediaTag.updateMany({ where: { tagId: sourceId }, data: { tagId: targetId } }),
    prisma.tag.delete({ where: { id: sourceId } }),
  ]);

  const count = await prisma.mediaTag.count({ where: { tagId: targetId } });
  await prisma.tag.update({ where: { id: targetId }, data: { usageCount: count } });

  await logAudit(check.session.user.id, "tag.merge", "tag", targetId);
  return { ok: true as const };
}

export async function deleteTag(tagId: string) {
  const check = await requireModerator();
  if (!check.ok) return check;

  await prisma.tag.delete({ where: { id: tagId } });
  await logAudit(check.session.user.id, "tag.delete", "tag", tagId);
  return { ok: true as const };
}

// ----------------------------------------------------------- Characters ---

export async function upsertCharacter(input: {
  id?: string;
  name: string;
  seriesId: string | null;
  avatarUrl: string;
  description: string;
}) {
  const check = await requireModerator();
  if (!check.ok) return check;

  const cleanName = parseName(input.name);
  if (!cleanName) return { ok: false as const, error: "Name can't be empty." };
  const slug = slugify(cleanName);
  if (!slug) return { ok: false as const, error: "That name doesn't produce a valid slug." };

  const collision = await prisma.character.findUnique({ where: { slug } });
  if (collision && collision.id !== input.id) {
    return { ok: false as const, error: "Another character already has that name — merge them instead." };
  }

  const data = {
    name: cleanName,
    slug,
    seriesId: input.seriesId || null,
    avatarUrl: input.avatarUrl.trim() || null,
    description: input.description.trim() || null,
  };

  const character = input.id
    ? await prisma.character.update({ where: { id: input.id }, data })
    : await prisma.character.create({ data });

  await logAudit(check.session.user.id, input.id ? "character.edit" : "character.create", "character", character.id);
  return { ok: true as const, id: character.id };
}

export async function mergeCharacters(sourceId: string, targetId: string) {
  const check = await requireModerator();
  if (!check.ok) return check;
  if (sourceId === targetId) return { ok: false as const, error: "Can't merge a character into itself." };

  const targetMediaIds = (
    await prisma.mediaCharacter.findMany({ where: { characterId: targetId }, select: { mediaId: true } })
  ).map((r) => r.mediaId);

  await prisma.$transaction([
    prisma.mediaCharacter.deleteMany({ where: { characterId: sourceId, mediaId: { in: targetMediaIds } } }),
    prisma.mediaCharacter.updateMany({ where: { characterId: sourceId }, data: { characterId: targetId } }),
    prisma.character.delete({ where: { id: sourceId } }),
  ]);

  await logAudit(check.session.user.id, "character.merge", "character", targetId);
  return { ok: true as const };
}

export async function deleteCharacter(characterId: string) {
  const check = await requireModerator();
  if (!check.ok) return check;

  await prisma.character.delete({ where: { id: characterId } });
  await logAudit(check.session.user.id, "character.delete", "character", characterId);
  return { ok: true as const };
}

// --------------------------------------------------------------- Series ---

export async function upsertSeries(input: {
  id?: string;
  name: string;
  type: SeriesType;
  coverUrl: string;
  description: string;
}) {
  const check = await requireModerator();
  if (!check.ok) return check;

  const cleanName = parseName(input.name);
  if (!cleanName) return { ok: false as const, error: "Name can't be empty." };
  const slug = slugify(cleanName);
  if (!slug) return { ok: false as const, error: "That name doesn't produce a valid slug." };

  const collision = await prisma.series.findUnique({ where: { slug } });
  if (collision && collision.id !== input.id) {
    return { ok: false as const, error: "Another series already has that name — merge them instead." };
  }

  const data = {
    name: cleanName,
    slug,
    type: input.type,
    coverUrl: input.coverUrl.trim() || null,
    description: input.description.trim() || null,
  };

  const series = input.id
    ? await prisma.series.update({ where: { id: input.id }, data })
    : await prisma.series.create({ data });

  await logAudit(check.session.user.id, input.id ? "series.edit" : "series.create", "series", series.id);
  return { ok: true as const, id: series.id };
}

export async function mergeSeries(sourceId: string, targetId: string) {
  const check = await requireModerator();
  if (!check.ok) return check;
  if (sourceId === targetId) return { ok: false as const, error: "Can't merge a series into itself." };

  const targetMediaIds = (
    await prisma.mediaSeries.findMany({ where: { seriesId: targetId }, select: { mediaId: true } })
  ).map((r) => r.mediaId);

  await prisma.$transaction([
    prisma.mediaSeries.deleteMany({ where: { seriesId: sourceId, mediaId: { in: targetMediaIds } } }),
    prisma.mediaSeries.updateMany({ where: { seriesId: sourceId }, data: { seriesId: targetId } }),
    prisma.character.updateMany({ where: { seriesId: sourceId }, data: { seriesId: targetId } }),
    prisma.series.delete({ where: { id: sourceId } }),
  ]);

  await logAudit(check.session.user.id, "series.merge", "series", targetId);
  return { ok: true as const };
}

export async function deleteSeries(seriesId: string) {
  const check = await requireModerator();
  if (!check.ok) return check;

  await prisma.series.delete({ where: { id: seriesId } });
  await logAudit(check.session.user.id, "series.delete", "series", seriesId);
  return { ok: true as const };
}
