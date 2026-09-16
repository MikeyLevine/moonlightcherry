import { headers } from "next/headers";

/**
 * In-memory sliding-window rate limiter. Deliberately not Postgres/Redis-backed
 * (PLAN.md's "modest infra" stance) — this is a single long-running Node
 * process, so a Map is sufficient. Trade-off, documented rather than hidden:
 * counters reset on every deploy/restart, and this would need to move to a
 * shared store the moment there's more than one app instance.
 */
type Hit = number[];
const buckets = new Map<string, Hit>();

// Sweep old buckets periodically so this doesn't grow unbounded across a long
// worker lifetime.
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, hits] of buckets) {
    if (hits.length === 0 || now - hits[hits.length - 1] > SWEEP_INTERVAL_MS) buckets.delete(key);
  }
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

/** `windowMs` window, `limit` allowed hits per key. Call at the top of an action/route. */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const hits = buckets.get(key) ?? [];
  const cutoff = now - windowMs;
  const recent = hits.filter((t) => t > cutoff);

  if (recent.length >= limit) {
    const retryAfterSeconds = Math.ceil((recent[0] + windowMs - now) / 1000);
    buckets.set(key, recent);
    return { ok: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  }

  recent.push(now);
  buckets.set(key, recent);
  return { ok: true };
}

/** Best-effort client IP from the `X-Forwarded-For` header Caddy sets in front of the app.
 * Falls back to a shared bucket when there's no proxy in front (plain local dev) — rate
 * limiting degrades to "one bucket for all direct connections" there, which is fine since
 * dev traffic isn't adversarial. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

/** Same idea for Route Handlers, which already have the request object. */
export function getClientIpFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

/**
 * Default limit counts + fixed windows. The count half of each is overridable
 * from /admin/settings (src/lib/site-settings.ts) without a redeploy; the
 * window stays fixed in code — the number an admin actually wants to turn is
 * "how many," not "over what period," and exposing both would double the
 * settings surface for little real benefit.
 */
export const RATE_LIMITS = {
  upload: { limit: 15, windowMs: 60 * 60 * 1000 },
  uploadPerIp: { limit: 30, windowMs: 60 * 60 * 1000 },
  comment: { limit: 20, windowMs: 5 * 60 * 1000 },
  message: { limit: 40, windowMs: 5 * 60 * 1000 },
  report: { limit: 10, windowMs: 60 * 60 * 1000 },
  reportPerIp: { limit: 20, windowMs: 60 * 60 * 1000 },
  profileUpdate: { limit: 10, windowMs: 60 * 60 * 1000 },
} as const;
