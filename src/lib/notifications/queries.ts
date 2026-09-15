import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type NotificationPayload = { actorId?: string; mediaId?: string; commentId?: string };

export type NotificationView = {
  id: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
  actor: { id: string; name: string | null; username: string | null; image: string | null } | null;
  media: { id: string; title: string | null; thumbnailUrl: string | null } | null;
  href: string;
};

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, read: false } });
}

/**
 * Payloads only ever store stable ids (actorId/mediaId/commentId) — never a
 * snapshotted name — so a notification from months ago still points at
 * whoever that user is *now* (e.g. after a username change) instead of
 * silently going stale.
 */
export async function getNotifications(userId: string, take = 50): Promise<NotificationView[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });

  const payloads = rows.map((r) => r.payload as NotificationPayload);
  const actorIds = Array.from(new Set(payloads.map((p) => p.actorId).filter((v): v is string => Boolean(v))));
  const mediaIds = Array.from(new Set(payloads.map((p) => p.mediaId).filter((v): v is string => Boolean(v))));

  const [actors, mediaItems] = await Promise.all([
    actorIds.length > 0
      ? prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, username: true, image: true } })
      : Promise.resolve([]),
    mediaIds.length > 0
      ? prisma.media.findMany({
          where: { id: { in: mediaIds } },
          select: { id: true, title: true, variants: { where: { kind: { in: ["THUMBNAIL", "POSTER"] } } } },
        })
      : Promise.resolve([]),
  ]);

  const actorMap = new Map(actors.map((a) => [a.id, a]));
  const mediaMap = new Map(mediaItems.map((m) => [m.id, m]));

  return rows.map((r) => {
    const payload = r.payload as NotificationPayload;
    const actor = payload.actorId ? (actorMap.get(payload.actorId) ?? null) : null;
    const media = payload.mediaId ? mediaMap.get(payload.mediaId) : undefined;
    const href = payload.mediaId ? `/i/${payload.mediaId}` : actor?.username ? `/u/${actor.username}` : "/notifications";

    return {
      id: r.id,
      type: r.type,
      read: r.read,
      createdAt: r.createdAt,
      actor,
      media: media ? { id: media.id, title: media.title, thumbnailUrl: media.variants[0]?.url ?? null } : null,
      href,
    };
  });
}
