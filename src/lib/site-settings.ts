import { prisma } from "@/lib/prisma";

export async function getSiteSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  if (!row) return fallback;
  return row.value as T;
}

export async function getUploadLimits() {
  const [maxImageBytes, maxGifBytes, maxDimensionPx, warnThresholdPercent, blockThresholdPercent] =
    await Promise.all([
      getSiteSetting("upload.maxImageBytes", 20 * 1024 * 1024),
      getSiteSetting("upload.maxGifBytes", 50 * 1024 * 1024),
      getSiteSetting("upload.maxDimensionPx", 8000),
      getSiteSetting("storage.warnThresholdPercent", 80),
      getSiteSetting("storage.blockThresholdPercent", 90),
    ]);

  return { maxImageBytes, maxGifBytes, maxDimensionPx, warnThresholdPercent, blockThresholdPercent };
}
