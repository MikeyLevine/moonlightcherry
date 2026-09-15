"use server";

import type { CollectionVisibility } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireOwner(collectionId: string, userId: string) {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { ownerId: true, deletedAt: true },
  });
  if (!collection || collection.deletedAt) return { ok: false as const, error: "Collection not found." };
  if (collection.ownerId !== userId) return { ok: false as const, error: "You can only manage your own collections." };
  return { ok: true as const };
}

export async function createCollection(input: { name: string; description: string; visibility: CollectionVisibility }) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Sign in to create a collection." };

  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "Give the collection a name." };

  const collection = await prisma.collection.create({
    data: {
      ownerId: session.user.id,
      name,
      description: input.description.trim() || null,
      visibility: input.visibility,
    },
  });

  return { ok: true as const, id: collection.id };
}

export async function updateCollection(
  collectionId: string,
  input: { name: string; description: string; visibility: CollectionVisibility }
) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Sign in to edit this." };

  const check = await requireOwner(collectionId, session.user.id);
  if (!check.ok) return check;

  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "Give the collection a name." };

  await prisma.collection.update({
    where: { id: collectionId },
    data: { name, description: input.description.trim() || null, visibility: input.visibility },
  });

  return { ok: true as const };
}

export async function deleteCollection(collectionId: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Sign in to delete this." };

  const check = await requireOwner(collectionId, session.user.id);
  if (!check.ok) return check;

  await prisma.collection.update({ where: { id: collectionId }, data: { deletedAt: new Date() } });
  return { ok: true as const };
}

export async function toggleCollectionMedia(collectionId: string, mediaId: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Sign in to save to a collection." };

  const check = await requireOwner(collectionId, session.user.id);
  if (!check.ok) return check;

  const existing = await prisma.collectionMedia.findUnique({
    where: { collectionId_mediaId: { collectionId, mediaId } },
  });

  if (existing) {
    await prisma.collectionMedia.delete({ where: { collectionId_mediaId: { collectionId, mediaId } } });
    return { ok: true as const, added: false };
  }

  await prisma.collectionMedia.create({ data: { collectionId, mediaId } });
  return { ok: true as const, added: true };
}
