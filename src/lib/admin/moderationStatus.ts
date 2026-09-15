import type { ModerationStatus } from "@prisma/client";

/** TIMED_OUT/SUSPENDED with a `moderationUntil` in the past are treated as
 * lifted automatically — no cron job needed, just compare at read time. A
 * status with no `until` stays in effect until a moderator clears it. */
function isActiveRestriction(status: ModerationStatus, until: Date | null): boolean {
  if (status === "ACTIVE" || status === "WARNED") return false;
  if (!until) return true;
  return until.getTime() > Date.now();
}

export function blocksSignIn(status: ModerationStatus, until: Date | null): boolean {
  if (status === "BANNED") return true;
  if (status === "SUSPENDED") return isActiveRestriction(status, until);
  return false;
}

export function blocksPosting(status: ModerationStatus, until: Date | null): boolean {
  return (
    (status === "MUTED" || status === "TIMED_OUT" || status === "SUSPENDED" || status === "BANNED") &&
    isActiveRestriction(status, until)
  );
}

export function blocksUploading(status: ModerationStatus, until: Date | null): boolean {
  return (status === "RESTRICTED" || status === "SUSPENDED" || status === "BANNED") && isActiveRestriction(status, until);
}
