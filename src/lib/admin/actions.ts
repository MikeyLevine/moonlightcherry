"use server";

import type { ModerationStatus, Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isModerator, canModerateRole, canAssignRole } from "@/lib/admin/permissions";
import { createNotification } from "@/lib/notifications/create";

async function requireModerator() {
  const session = await auth();
  if (!session?.user || !isModerator(session.user.role)) {
    return { ok: false as const, error: "You don't have permission to do that." };
  }
  return { ok: true as const, session };
}

const KICKS_OUT: ModerationStatus[] = ["BANNED", "SUSPENDED"];

export async function applyUserModeration(
  targetUserId: string,
  input: { status: ModerationStatus; reason: string; durationHours?: number }
) {
  const check = await requireModerator();
  if (!check.ok) return check;
  const { session } = check;

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { role: true } });
  if (!target) return { ok: false as const, error: "User not found." };
  if (!canModerateRole(session.user.role, target.role)) {
    return { ok: false as const, error: "You can't moderate a user at or above your own role." };
  }

  const moderationUntil = input.durationHours ? new Date(Date.now() + input.durationHours * 60 * 60 * 1000) : null;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUserId },
      data: { moderationStatus: input.status, moderationUntil, moderationReason: input.reason || null },
    }),
    prisma.moderationAction.create({
      data: {
        actorId: session.user.id,
        action: input.status === "BANNED" ? "BAN" : input.status === "SUSPENDED" ? "SUSPEND" : input.status === "MUTED" ? "MUTE" : input.status === "TIMED_OUT" ? "TIMEOUT" : input.status === "RESTRICTED" ? "RESTRICT" : "WARN",
        targetUserId,
        reason: input.reason || null,
        metadata: moderationUntil ? { until: moderationUntil.toISOString() } : undefined,
      },
    }),
    prisma.auditLog.create({
      data: { actorId: session.user.id, action: `user.moderation.${input.status.toLowerCase()}`, targetType: "user", targetId: targetUserId, metadata: { reason: input.reason } },
    }),
  ]);

  if (KICKS_OUT.includes(input.status)) {
    await prisma.session.deleteMany({ where: { userId: targetUserId } });
  }

  await createNotification(targetUserId, "MODERATION", { actorId: session.user.id, status: input.status, reason: input.reason }, session.user.id);

  return { ok: true as const };
}

export async function changeUserRole(targetUserId: string, newRole: Role) {
  const check = await requireModerator();
  if (!check.ok) return check;
  const { session } = check;

  if (!canAssignRole(session.user.role, newRole)) {
    return { ok: false as const, error: "You can't assign that role." };
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { role: true } });
  if (!target) return { ok: false as const, error: "User not found." };
  if (!canModerateRole(session.user.role, target.role) && target.role !== newRole) {
    return { ok: false as const, error: "You can't change the role of a user at or above your own role." };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: targetUserId }, data: { role: newRole } }),
    prisma.moderationAction.create({
      data: { actorId: session.user.id, action: "ROLE_CHANGE", targetUserId, metadata: { from: target.role, to: newRole } },
    }),
    prisma.auditLog.create({
      data: { actorId: session.user.id, action: "user.role_change", targetType: "user", targetId: targetUserId, metadata: { from: target.role, to: newRole } },
    }),
  ]);

  return { ok: true as const };
}

export async function moderateMedia(mediaId: string, action: "REMOVE" | "RESTORE" | "DELETE" | "TOGGLE_FEATURED") {
  const check = await requireModerator();
  if (!check.ok) return check;
  const { session } = check;

  const media = await prisma.media.findUnique({ where: { id: mediaId }, select: { status: true, featured: true } });
  if (!media) return { ok: false as const, error: "Media not found." };

  if (action === "REMOVE") {
    await prisma.media.update({ where: { id: mediaId }, data: { status: "REMOVED" } });
  } else if (action === "RESTORE") {
    await prisma.media.update({ where: { id: mediaId }, data: { status: "PUBLISHED" } });
  } else if (action === "DELETE") {
    await prisma.media.update({ where: { id: mediaId }, data: { deletedAt: new Date() } });
  } else if (action === "TOGGLE_FEATURED") {
    await prisma.media.update({ where: { id: mediaId }, data: { featured: !media.featured } });
  }

  await Promise.all([
    prisma.moderationAction.create({
      data: {
        actorId: session.user.id,
        action:
          action === "DELETE"
            ? "REMOVE"
            : action === "TOGGLE_FEATURED"
              ? "EDIT_METADATA"
              : action === "RESTORE"
                ? "APPROVE"
                : action,
        targetType: "media",
        targetId: mediaId,
      },
    }),
    prisma.auditLog.create({
      data: { actorId: session.user.id, action: `media.${action.toLowerCase()}`, targetType: "media", targetId: mediaId },
    }),
  ]);

  return { ok: true as const };
}

export async function resolveReport(reportId: string, status: "RESOLVED" | "REJECTED") {
  const check = await requireModerator();
  if (!check.ok) return check;
  const { session } = check;

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return { ok: false as const, error: "Report not found." };

  await prisma.$transaction([
    prisma.report.update({ where: { id: reportId }, data: { status, resolvedAt: new Date(), assignedToId: session.user.id } }),
    prisma.auditLog.create({
      data: { actorId: session.user.id, action: `report.${status.toLowerCase()}`, targetType: report.targetType.toLowerCase(), targetId: report.targetId },
    }),
  ]);

  return { ok: true as const };
}
