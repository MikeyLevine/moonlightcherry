"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { extractMentionedUsernames } from "@/lib/comments/mentions";
import { createNotification, createNotifications } from "@/lib/notifications/create";
import { blocksPosting } from "@/lib/admin/moderationStatus";
import { commentContentSchema } from "@/lib/security/schemas";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getRateLimitOverrides } from "@/lib/site-settings";

const AUTHOR_SELECT = { id: true, name: true, username: true, image: true } as const;

export async function postComment(mediaId: string, content: string, parentId: string | null) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Sign in to comment." };
  if (blocksPosting(session.user.moderationStatus, session.user.moderationUntil)) {
    return { ok: false as const, error: "Your account can't post comments right now." };
  }

  const limits = await getRateLimitOverrides();
  const rateLimit = checkRateLimit(`comment:${session.user.id}`, limits.comment, RATE_LIMITS.comment.windowMs);
  if (!rateLimit.ok) {
    return { ok: false as const, error: `You're commenting too fast — try again in a bit.` };
  }

  const parsed = commentContentSchema.safeParse(content);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const trimmed = parsed.data;

  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { uploaderId: true, status: true, deletedAt: true },
  });
  if (!media || media.status !== "PUBLISHED" || media.deletedAt) {
    return { ok: false as const, error: "Can't comment on this." };
  }

  let effectiveParentId: string | null = null;
  let parentAuthorId: string | null = null;
  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { id: true, parentId: true, authorId: true, mediaId: true, deletedAt: true },
    });
    if (!parent || parent.mediaId !== mediaId || parent.deletedAt) {
      return { ok: false as const, error: "Can't reply to that comment." };
    }
    // Single-level nesting: replying to a reply attaches to its original thread.
    effectiveParentId = parent.parentId ?? parent.id;
    parentAuthorId = parent.authorId;
  }

  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: { mediaId, authorId: session.user.id, parentId: effectiveParentId, content: trimmed },
      include: { author: { select: AUTHOR_SELECT } },
    }),
    prisma.media.update({ where: { id: mediaId }, data: { commentCount: { increment: 1 } } }),
  ]);

  const actorId = session.user.id;

  if (effectiveParentId && parentAuthorId) {
    await createNotification(parentAuthorId, "REPLY", { actorId, mediaId, commentId: comment.id }, actorId);
  } else if (media.uploaderId) {
    await createNotification(media.uploaderId, "COMMENT", { actorId, mediaId, commentId: comment.id }, actorId);
  }

  const mentionedUsernames = extractMentionedUsernames(trimmed);
  if (mentionedUsernames.length > 0) {
    const mentionedUsers = await prisma.user.findMany({
      where: { username: { in: mentionedUsernames } },
      select: { id: true },
    });
    await createNotifications(
      mentionedUsers.map((u) => u.id),
      "MENTION",
      { actorId, mediaId, commentId: comment.id },
      actorId
    );
  }

  return {
    ok: true as const,
    comment: {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: comment.author,
      likeCount: 0,
      liked: false,
      parentId: effectiveParentId,
    },
  };
}

export async function deleteComment(commentId: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Sign in." };

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, mediaId: true, deletedAt: true },
  });
  if (!comment || comment.deletedAt) return { ok: false as const, error: "Comment not found." };
  if (comment.authorId !== session.user.id) {
    return { ok: false as const, error: "You can only delete your own comments." };
  }

  await prisma.$transaction([
    prisma.comment.update({ where: { id: commentId }, data: { deletedAt: new Date() } }),
    prisma.media.update({ where: { id: comment.mediaId }, data: { commentCount: { decrement: 1 } } }),
  ]);

  return { ok: true as const };
}

export async function toggleCommentLike(commentId: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Sign in to like this." };

  const userId = session.user.id;
  const existing = await prisma.commentLike.findUnique({ where: { commentId_userId: { commentId, userId } } });

  if (existing) {
    await prisma.commentLike.delete({ where: { id: existing.id } });
    const count = await prisma.commentLike.count({ where: { commentId } });
    return { ok: true as const, active: false, count };
  }

  await prisma.commentLike.create({ data: { commentId, userId } });
  const count = await prisma.commentLike.count({ where: { commentId } });
  return { ok: true as const, active: true, count };
}
