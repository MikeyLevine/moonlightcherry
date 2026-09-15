import { prisma } from "@/lib/prisma";
import { checkStorageHeadroom } from "@/lib/media/storage";
import { getUploadLimits } from "@/lib/site-settings";

export async function getDashboardStats() {
  const [userCount, mediaCount, publishedCount, openReportCount, recentSignups, limits] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.media.count({ where: { deletedAt: null } }),
    prisma.media.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.user.count({ where: { deletedAt: null, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    getUploadLimits(),
  ]);

  const storage = await checkStorageHeadroom(limits.warnThresholdPercent, limits.blockThresholdPercent);

  return { userCount, mediaCount, publishedCount, openReportCount, recentSignups, storage };
}

export async function searchUsersAdmin(q: string | null, take = 50) {
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { username: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
      role: true,
      moderationStatus: true,
      moderationUntil: true,
      createdAt: true,
      _count: { select: { media: true } },
    },
  });
}

export async function searchMediaAdmin(q: string | null, take = 50) {
  return prisma.media.findMany({
    where: {
      deletedAt: null,
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      title: true,
      status: true,
      nsfw: true,
      featured: true,
      createdAt: true,
      likeCount: true,
      viewCount: true,
      uploader: { select: { id: true, name: true, username: true } },
      variants: { where: { kind: { in: ["THUMBNAIL", "POSTER"] } } },
    },
  });
}

export async function listReports(status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED" = "OPEN", take = 50) {
  const reports = await prisma.report.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take,
    include: { reporter: { select: { id: true, name: true, username: true } } },
  });

  const mediaIds = reports.filter((r) => r.targetType === "MEDIA").map((r) => r.targetId);
  const userIds = reports.filter((r) => r.targetType === "USER").map((r) => r.targetId);

  const [mediaTargets, userTargets] = await Promise.all([
    mediaIds.length > 0
      ? prisma.media.findMany({ where: { id: { in: mediaIds } }, select: { id: true, title: true } })
      : Promise.resolve([]),
    userIds.length > 0
      ? prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, username: true } })
      : Promise.resolve([]),
  ]);

  const mediaMap = new Map(mediaTargets.map((m) => [m.id, m]));
  const userMap = new Map(userTargets.map((u) => [u.id, u]));

  return reports.map((r) => ({
    ...r,
    targetLabel:
      r.targetType === "MEDIA"
        ? (mediaMap.get(r.targetId)?.title ?? "Untitled upload")
        : r.targetType === "USER"
          ? (userMap.get(r.targetId)?.name ?? userMap.get(r.targetId)?.username ?? "Unknown user")
          : r.targetType,
  }));
}
