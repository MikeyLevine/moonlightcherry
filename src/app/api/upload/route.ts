import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import type { SeriesType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateUpload } from "@/lib/media/validate";
import { putMediaFile, checkStorageHeadroom } from "@/lib/media/storage";
import { getUploadLimits, getRateLimitOverrides } from "@/lib/site-settings";
import { enqueueProcessMedia } from "@/lib/media/queue";
import { syncMediaAssociations } from "@/lib/taxonomy/sync";
import { blocksUploading } from "@/lib/admin/moderationStatus";
import { uploadMetadataSchema, taxonomyNameSchema } from "@/lib/security/schemas";
import { checkRateLimit, getClientIpFromRequest, RATE_LIMITS } from "@/lib/security/rate-limit";
import { verifyTurnstile } from "@/lib/security/turnstile";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

const SERIES_TYPES: SeriesType[] = ["ANIME", "MANGA", "OTHER"];

function stringField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "You must be signed in to upload." }, { status: 401 });
  }
  if (blocksUploading(session.user.moderationStatus, session.user.moderationUntil)) {
    return NextResponse.json({ error: "Your account can't upload right now." }, { status: 403 });
  }

  const ip = getClientIpFromRequest(req);
  const rateLimits = await getRateLimitOverrides();
  const perUser = checkRateLimit(`upload:${session.user.id}`, rateLimits.upload, RATE_LIMITS.upload.windowMs);
  if (!perUser.ok) {
    return NextResponse.json(
      { error: "You're uploading too fast — try again later." },
      { status: 429, headers: { "Retry-After": String(perUser.retryAfterSeconds) } }
    );
  }
  const perIp = checkRateLimit(`upload-ip:${ip}`, rateLimits.uploadPerIp, RATE_LIMITS.uploadPerIp.windowMs);
  if (!perIp.ok) {
    return NextResponse.json(
      { error: "Too many uploads from this network — try again later." },
      { status: 429, headers: { "Retry-After": String(perIp.retryAfterSeconds) } }
    );
  }

  const limits = await getUploadLimits();
  const headroom = await checkStorageHeadroom(limits.warnThresholdPercent, limits.blockThresholdPercent);
  if (headroom.overBlockThreshold) {
    return NextResponse.json(
      { error: "Uploads are temporarily paused — the server is low on storage. Try again later." },
      { status: 503 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const turnstile = await verifyTurnstile(stringField(formData, "turnstileToken") || null);
  if (!turnstile.ok) {
    return NextResponse.json({ error: turnstile.error ?? "Verification failed." }, { status: 403 });
  }

  const metadataResult = uploadMetadataSchema.safeParse({
    title: stringField(formData, "title"),
    description: stringField(formData, "description"),
  });
  if (!metadataResult.success) {
    return NextResponse.json({ error: metadataResult.error.issues[0].message }, { status: 422 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = await validateUpload(buffer);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 422 });
  }

  const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

  const existing = await prisma.media.findUnique({ where: { checksumSha256: checksum } });
  if (existing) {
    return NextResponse.json({ id: existing.id, deduplicated: true });
  }

  const ext = EXT_BY_MIME[validation.mimeType] ?? "bin";
  await putMediaFile(checksum, `original.${ext}`, buffer);

  const { title, description } = metadataResult.data;
  const nsfw = stringField(formData, "nsfw") === "true";
  const seriesTypeRaw = stringField(formData, "seriesType");
  const seriesType = SERIES_TYPES.includes(seriesTypeRaw as SeriesType) ? (seriesTypeRaw as SeriesType) : "ANIME";

  const media = await prisma.media.create({
    data: {
      uploaderId: session.user.id,
      title: title || null,
      description: description || null,
      nsfw,
      status: "PROCESSING",
      mimeType: validation.mimeType,
      width: validation.width,
      height: validation.height,
      fileSize: buffer.byteLength,
      checksumSha256: checksum,
    },
  });

  const clampName = (value: string) => taxonomyNameSchema.safeParse(value).data ?? value.slice(0, 80);

  await syncMediaAssociations(media.id, {
    tagNames: stringField(formData, "tags").split(",").map(clampName),
    characterName: clampName(stringField(formData, "character").trim()) || null,
    seriesName: clampName(stringField(formData, "series").trim()) || null,
    seriesType,
    categoryIds: formData.getAll("categoryIds").filter((v): v is string => typeof v === "string"),
  });

  await enqueueProcessMedia(media.id);

  return NextResponse.json({ id: media.id });
}
