"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user) return { ok: false as const };

  await prisma.notification.updateMany({ where: { userId: session.user.id, read: false }, data: { read: true } });
  return { ok: true as const };
}
