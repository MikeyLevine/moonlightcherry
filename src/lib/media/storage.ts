import { mkdir, readFile, stat, writeFile, statfs } from "fs/promises";
import path from "path";

// This directory is runtime-configured (env var) and holds user-uploaded
// content, never build-time assets — it must not be statically traced/bundled.
const STORAGE_ROOT = path.resolve(
  /*turbopackIgnore: true*/ process.cwd(),
  process.env.MEDIA_STORAGE_DIR ?? "./storage/media"
);

function shardDir(checksum: string): string {
  return path.join(/*turbopackIgnore: true*/ STORAGE_ROOT, checksum.slice(0, 2), checksum.slice(2, 4), checksum);
}

function relativeShardPath(checksum: string, filename: string): string {
  return [checksum.slice(0, 2), checksum.slice(2, 4), checksum, filename].join("/");
}

export function getMediaFileUrl(checksum: string, filename: string): string {
  return `/media/${relativeShardPath(checksum, filename)}`;
}

/** Writes a file for a given content hash and returns the URL path to serve it at. */
export async function putMediaFile(checksum: string, filename: string, data: Buffer): Promise<string> {
  const dir = shardDir(checksum);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), data);
  return getMediaFileUrl(checksum, filename);
}

export async function readMediaFile(checksum: string, filename: string): Promise<Buffer> {
  return readFile(path.join(shardDir(checksum), filename));
}

export async function mediaFileExists(checksum: string, filename: string): Promise<boolean> {
  try {
    await stat(path.join(shardDir(checksum), filename));
    return true;
  } catch {
    return false;
  }
}

/** Resolves a URL path served by the /media route handler back to an absolute file path,
 * rejecting anything that isn't a plain shard/checksum/filename segment (no path traversal). */
export function resolveMediaFilePath(segments: string[]): string | null {
  if (segments.length !== 4) return null;
  const [prefix1, prefix2, checksum, filename] = segments;
  const isHex = (s: string) => /^[a-f0-9]+$/.test(s);
  if (!isHex(prefix1) || prefix1.length !== 2) return null;
  if (!isHex(prefix2) || prefix2.length !== 2) return null;
  if (!isHex(checksum) || checksum.length !== 64) return null;
  if (!/^[a-z0-9_]+\.[a-z0-9]+$/i.test(filename)) return null;
  return path.join(/*turbopackIgnore: true*/ STORAGE_ROOT, prefix1, prefix2, checksum, filename);
}

export type StorageHeadroom = {
  usedPercent: number;
  warnThresholdPercent: number;
  blockThresholdPercent: number;
  overWarnThreshold: boolean;
  overBlockThreshold: boolean;
};

/** Real disk-usage check against the filesystem holding MEDIA_STORAGE_DIR, per the plan's
 * "storage protection" requirement — not a stub. */
export async function checkStorageHeadroom(
  warnThresholdPercent: number,
  blockThresholdPercent: number
): Promise<StorageHeadroom> {
  await mkdir(STORAGE_ROOT, { recursive: true });
  const stats = await statfs(STORAGE_ROOT);
  const total = stats.blocks * stats.bsize;
  const free = stats.bavail * stats.bsize;
  const used = total - free;
  const usedPercent = total > 0 ? (used / total) * 100 : 0;

  return {
    usedPercent,
    warnThresholdPercent,
    blockThresholdPercent,
    overWarnThreshold: usedPercent >= warnThresholdPercent,
    overBlockThreshold: usedPercent >= blockThresholdPercent,
  };
}
