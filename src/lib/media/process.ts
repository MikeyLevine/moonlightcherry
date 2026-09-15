import sharp from "sharp";
import type { MediaVariantKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getMediaFileUrl, putMediaFile, readMediaFile } from "@/lib/media/storage";
import { screenForCsam } from "@/lib/media/csam-screen";
import { createNotifications } from "@/lib/notifications/create";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

type VariantWrite = {
  kind: MediaVariantKind;
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
};

async function resizeStatic(buffer: Buffer, maxWidth: number, quality: number) {
  return sharp(buffer)
    .resize({ width: maxWidth, withoutEnlargement: true, fit: "inside" })
    .webp({ quality })
    .toBuffer({ resolveWithObject: true });
}

async function resizeAnimated(buffer: Buffer, maxWidth: number, quality: number, effort: number) {
  const { data } = await sharp(buffer, { animated: true })
    .resize({ width: maxWidth, withoutEnlargement: true, fit: "inside" })
    .webp({ quality, effort })
    .toBuffer({ resolveWithObject: true });

  // toBuffer's own `info.height` is the internal stacked-all-frames height,
  // not the true per-frame height — re-probe the encoded output for that.
  const encodedMeta = await sharp(data, { animated: true }).metadata();
  const width = encodedMeta.width ?? maxWidth;
  const height = encodedMeta.pageHeight ?? encodedMeta.height ?? 0;

  return { data, info: { width, height } };
}

/**
 * Runs the full processing pipeline for an already-uploaded, already-stored
 * original file: CSAM screen -> variant generation -> DB writes -> publish.
 * Called from the pg-boss worker (see scripts/worker.ts), kept separate from
 * the upload route so it can also be invoked directly for local testing.
 */
export async function processMedia(mediaId: string): Promise<void> {
  const media = await prisma.media.findUniqueOrThrow({ where: { id: mediaId } });
  const ext = EXT_BY_MIME[media.mimeType] ?? "bin";
  const original = await readMediaFile(media.checksumSha256, `original.${ext}`);

  const screen = await screenForCsam(original);
  if (!screen.clear) {
    await prisma.$transaction([
      prisma.media.update({ where: { id: media.id }, data: { status: "REMOVED" } }),
      prisma.auditLog.create({
        data: { action: "csam_screen_flagged", targetType: "media", targetId: media.id },
      }),
    ]);
    return;
  }

  const probe = await sharp(original, { animated: true }).metadata();
  const frameCount = probe.pages ?? 1;
  const isAnimated = media.mimeType === "image/gif" && frameCount > 1;

  const variants: VariantWrite[] = [];

  if (isAnimated) {
    const poster = await sharp(original, { animated: false })
      .resize({ width: 600, withoutEnlargement: true, fit: "inside" })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
    variants.push({ kind: "POSTER", buffer: poster.data, width: poster.info.width, height: poster.info.height, format: "webp" });

    const preview = await resizeAnimated(original, 480, 60, 4);
    variants.push({ kind: "ANIMATED_PREVIEW", buffer: preview.data, width: preview.info.width, height: preview.info.height, format: "webp" });

    const medium = await resizeAnimated(original, 1200, 75, 4);
    variants.push({ kind: "MEDIUM", buffer: medium.data, width: medium.info.width, height: medium.info.height, format: "webp" });
  } else {
    const thumb = await resizeStatic(original, 300, 82);
    variants.push({ kind: "THUMBNAIL", buffer: thumb.data, width: thumb.info.width, height: thumb.info.height, format: "webp" });

    const small = await resizeStatic(original, 600, 82);
    variants.push({ kind: "SMALL", buffer: small.data, width: small.info.width, height: small.info.height, format: "webp" });

    const medium = await resizeStatic(original, 1200, 85);
    variants.push({ kind: "MEDIUM", buffer: medium.data, width: medium.info.width, height: medium.info.height, format: "webp" });
  }

  for (const v of variants) {
    const filename = `${v.kind.toLowerCase()}.${v.format}`;
    const url = await putMediaFile(media.checksumSha256, filename, v.buffer);
    await prisma.mediaVariant.upsert({
      where: { mediaId_kind: { mediaId: media.id, kind: v.kind } },
      update: { url, width: v.width, height: v.height, format: v.format, fileSize: v.buffer.byteLength },
      create: {
        mediaId: media.id,
        kind: v.kind,
        url,
        width: v.width,
        height: v.height,
        format: v.format,
        fileSize: v.buffer.byteLength,
      },
    });
  }

  const originalUrl = getMediaFileUrl(media.checksumSha256, `original.${ext}`);
  await prisma.mediaVariant.upsert({
    where: { mediaId_kind: { mediaId: media.id, kind: "ORIGINAL" } },
    update: { url: originalUrl, width: media.width, height: media.height, format: ext, fileSize: media.fileSize },
    create: {
      mediaId: media.id,
      kind: "ORIGINAL",
      url: originalUrl,
      width: media.width,
      height: media.height,
      format: ext,
      fileSize: media.fileSize,
    },
  });

  await prisma.mediaMetadata.upsert({
    where: { mediaId: media.id },
    update: { frameCount: isAnimated ? frameCount : null },
    create: {
      mediaId: media.id,
      originalFilename: `${media.checksumSha256}.${ext}`,
      exifStripped: true,
      frameCount: isAnimated ? frameCount : null,
    },
  });

  await prisma.media.update({ where: { id: media.id }, data: { status: "PUBLISHED" } });

  if (media.uploaderId) {
    const followers = await prisma.follow.findMany({
      where: { followingId: media.uploaderId },
      select: { followerId: true },
    });
    if (followers.length > 0) {
      const uploader = await prisma.user.findUnique({ where: { id: media.uploaderId }, select: { name: true } });
      await createNotifications(
        followers.map((f) => f.followerId),
        "NEW_UPLOAD",
        { actorId: media.uploaderId, actorName: uploader?.name, mediaId: media.id },
        media.uploaderId
      );
    }
  }
}
