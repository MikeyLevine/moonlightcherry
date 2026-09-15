import type { Role } from "@prisma/client";

const ROLE_RANK: Record<Role, number> = {
  USER: 0,
  TRUSTED_UPLOADER: 1,
  MODERATOR: 2,
  ADMINISTRATOR: 3,
  OWNER: 4,
};

export function isModerator(role: Role | null | undefined): boolean {
  return Boolean(role && ROLE_RANK[role] >= ROLE_RANK.MODERATOR);
}

export function isAdmin(role: Role | null | undefined): boolean {
  return Boolean(role && ROLE_RANK[role] >= ROLE_RANK.ADMINISTRATOR);
}

/** Can `actorRole` take a moderation action (ban/mute/role-change/etc.)
 * against a user with `targetRole`? Strictly higher rank required — mods
 * can't act on admins/owners, admins can't act on owners, nobody can act on
 * an equal rank (e.g. one moderator moderating another). */
export function canModerateRole(actorRole: Role, targetRole: Role): boolean {
  return ROLE_RANK[actorRole] > ROLE_RANK[targetRole];
}

/** Can `actorRole` assign `newRole` to someone? Admins can promote/demote up
 * to Moderator; only Owner can create/change Administrators. */
export function canAssignRole(actorRole: Role, newRole: Role): boolean {
  if (actorRole === "OWNER") return true;
  if (actorRole === "ADMINISTRATOR") return ROLE_RANK[newRole] <= ROLE_RANK.MODERATOR;
  return false;
}
