import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateUpload } from "@/lib/media/validate";
import { putMediaFile, checkStorageHeadroom } from "@/lib/media/storage";
import { getUploadLimits } from "@/lib/site-settings";
import { enqueueProcessMedia } from "@/lib/media/queue";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "You must be signed in to upload." }, { status: 401 });
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
  const title = formData.get("title");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
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

  const media = await prisma.media.create({
    data: {
      uploaderId: session.user.id,
      title: typeof title === "string" && title.trim() ? title.trim() : null,
      status: "PROCESSING",
      mimeType: validation.mimeType,
      width: validation.width,
      height: validation.height,
      fileSize: buffer.byteLength,
      checksumSha256: checksum,
    },
  });

  await enqueueProcessMedia(media.id);

  return NextResponse.json({ id: media.id });
}
