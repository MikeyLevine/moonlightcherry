import type { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Writes notification rows only — there's no delivery/read UI yet (that's
 * Phase 12). This is the "hook" the plan calls for shipping alongside the
 * features that trigger it, so Phase 12 has real data to build against
 * instead of starting from an empty table.
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  payload: Prisma.InputJsonValue,
  actorId?: string | null
): Promise<void> {
  if (actorId && actorId === userId) return;
  await prisma.notification.create({ data: { userId, type, payload } });
}

export async function createNotifications(
  userIds: string[],
  type: NotificationType,
  payload: Prisma.InputJsonValue,
  actorId?: string | null
): Promise<void> {
  const targets = Array.from(new Set(userIds)).filter((id) => id !== actorId);
  if (targets.length === 0) return;
  await prisma.notification.createMany({ data: targets.map((userId) => ({ userId, type, payload })) });
}
