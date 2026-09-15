"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncMediaAssociations, type SyncAssociationsInput } from "@/lib/taxonomy/sync";

const EDITOR_ROLES = new Set(["MODERATOR", "ADMINISTRATOR", "OWNER"]);

/** Post-upload edit path (Phase 7's "Edit tags & metadata" panel on /i/[id]).
 * The upload-time path (Phase 9) calls syncMediaAssociations directly from
 * the upload route instead, since the uploader creating their own media
 * doesn't need this ownership check. */
export async function updateMediaAssociations(mediaId: string, input: SyncAssociationsInput) {
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

  await syncMediaAssociations(mediaId, input);
  return { ok: true as const };
}
