import { unstable_cache, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

const SETTINGS_CACHE_TAG = "site-settings";

/**
 * Every admin-configurable setting, in one place: the DB key, a human label
 * for /admin/settings, its group, and the fallback used when no row exists
 * yet (so shipping this feature never requires a data migration — every
 * setting already "exists" via its default until an admin actually changes
 * it). Defaults mirror the values already hardcoded elsewhere (e.g.
 * RATE_LIMITS) rather than duplicating a second set of magic numbers.
 */
export const SETTINGS_REGISTRY = [
  { key: "upload.maxImageBytes", label: "Max image size (bytes)", group: "Upload limits", default: 20 * 1024 * 1024, min: 1 },
  { key: "upload.maxGifBytes", label: "Max GIF size (bytes)", group: "Upload limits", default: 50 * 1024 * 1024, min: 1 },
  { key: "upload.maxDimensionPx", label: "Max image dimension (px)", group: "Upload limits", default: 8000, min: 1 },
  { key: "storage.warnThresholdPercent", label: "Storage warn threshold (%)", group: "Storage", default: 80, min: 1, max: 100 },
  { key: "storage.blockThresholdPercent", label: "Storage block threshold (%)", group: "Storage", default: 90, min: 1, max: 100 },
  { key: "rateLimit.upload.limit", label: "Uploads per account / hour", group: "Rate limits", default: RATE_LIMITS.upload.limit, min: 1 },
  { key: "rateLimit.uploadPerIp.limit", label: "Uploads per IP / hour", group: "Rate limits", default: RATE_LIMITS.uploadPerIp.limit, min: 1 },
  { key: "rateLimit.comment.limit", label: "Comments per account / 5 min", group: "Rate limits", default: RATE_LIMITS.comment.limit, min: 1 },
  { key: "rateLimit.message.limit", label: "Messages per account / 5 min", group: "Rate limits", default: RATE_LIMITS.message.limit, min: 1 },
  { key: "rateLimit.report.limit", label: "Reports per account / hour", group: "Rate limits", default: RATE_LIMITS.report.limit, min: 1 },
  { key: "rateLimit.reportPerIp.limit", label: "Reports per IP / hour", group: "Rate limits", default: RATE_LIMITS.reportPerIp.limit, min: 1 },
  { key: "rateLimit.profileUpdate.limit", label: "Profile updates per account / hour", group: "Rate limits", default: RATE_LIMITS.profileUpdate.limit, min: 1 },
] as const;

export type SettingKey = (typeof SETTINGS_REGISTRY)[number]["key"];

const getCachedSnapshot = unstable_cache(
  fetchSnapshot,
  ["site-settings-snapshot"],
  { revalidate: 30, tags: [SETTINGS_CACHE_TAG] }
);

async function fetchSnapshot(): Promise<Record<string, number>> {
  const keys = SETTINGS_REGISTRY.map((s) => s.key);
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: keys } } });
  const overrides = new Map(rows.map((r) => [r.key, r.value as number]));
  return Object.fromEntries(SETTINGS_REGISTRY.map((s) => [s.key, overrides.get(s.key) ?? s.default]));
}

/** Reads current effective values fresh (not cached) — for the admin UI itself,
 * which should show ground truth, not up to 30s of staleness after another
 * admin's edit. */
export const getRawSiteSettings = fetchSnapshot;

export async function saveSiteSettings(values: Partial<Record<SettingKey, number>>): Promise<void> {
  const writes = Object.entries(values).map(([key, value]) =>
    prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } })
  );
  await prisma.$transaction(writes);
  // Only callable from within a Server Action (updateSiteSettings is one) —
  // gives read-your-own-writes immediately, unlike revalidateTag's
  // stale-while-revalidate default in Next 16.
  updateTag(SETTINGS_CACHE_TAG);
}

export async function getUploadLimits() {
  const s = await getCachedSnapshot();
  return {
    maxImageBytes: s["upload.maxImageBytes"],
    maxGifBytes: s["upload.maxGifBytes"],
    maxDimensionPx: s["upload.maxDimensionPx"],
    warnThresholdPercent: s["storage.warnThresholdPercent"],
    blockThresholdPercent: s["storage.blockThresholdPercent"],
  };
}

export async function getRateLimitOverrides() {
  const s = await getCachedSnapshot();
  return {
    upload: s["rateLimit.upload.limit"],
    uploadPerIp: s["rateLimit.uploadPerIp.limit"],
    comment: s["rateLimit.comment.limit"],
    message: s["rateLimit.message.limit"],
    report: s["rateLimit.report.limit"],
    reportPerIp: s["rateLimit.reportPerIp.limit"],
    profileUpdate: s["rateLimit.profileUpdate.limit"],
  };
}
