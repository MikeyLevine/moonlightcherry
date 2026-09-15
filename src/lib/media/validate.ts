import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { getUploadLimits } from "@/lib/site-settings";

const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

export type ValidationResult =
  | {
      ok: true;
      mimeType: string;
      width: number;
      height: number;
      isAnimated: boolean;
    }
  | { ok: false; error: string };

/**
 * Validates a raw upload against real content, not the client's claimed
 * filename/mimetype. Sniffs magic bytes, checks size against admin-configured
 * SiteSetting limits, and checks dimensions.
 */
export async function validateUpload(buffer: Buffer): Promise<ValidationResult> {
  const limits = await getUploadLimits();

  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ACCEPTED_MIME_TYPES.has(detected.mime)) {
    return { ok: false, error: "Unsupported or unrecognized file type." };
  }

  const isGif = detected.mime === "image/gif";
  const maxBytes = isGif ? limits.maxGifBytes : limits.maxImageBytes;
  if (buffer.byteLength > maxBytes) {
    const limitMb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, error: `File is too large. Maximum is ${limitMb}MB for this file type.` };
  }

  let metadata;
  try {
    metadata = await sharp(buffer, { animated: true }).metadata();
  } catch {
    return { ok: false, error: "File could not be read as an image — it may be corrupt." };
  }

  const { width, pages = 1 } = metadata;
  // For animated images sharp's plain `height` is every frame stacked
  // together — `pageHeight` is the true single-frame height and is what
  // must be validated and stored.
  const height = pages > 1 ? metadata.pageHeight : metadata.height;
  if (!width || !height) {
    return { ok: false, error: "Could not determine image dimensions." };
  }

  if (width > limits.maxDimensionPx || height > limits.maxDimensionPx) {
    return { ok: false, error: `Image dimensions exceed the ${limits.maxDimensionPx}px limit.` };
  }

  return {
    ok: true,
    mimeType: detected.mime,
    width,
    height,
    isAnimated: isGif && pages > 1,
  };
}
