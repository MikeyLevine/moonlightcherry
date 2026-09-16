"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateConversation, isBlockedEitherWay, toMessageView } from "@/lib/messaging/queries";
import { blocksPosting } from "@/lib/admin/moderationStatus";
import { messageContentSchema } from "@/lib/security/schemas";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getRateLimitOverrides } from "@/lib/site-settings";
import { createNotification } from "@/lib/notifications/create";

export async function startConversation(targetUserId: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Sign in to send a message." };
  if (session.user.id === targetUserId) return { ok: false as const, error: "You can't message yourself." };

  const blocked = await isBlockedEitherWay(session.user.id, targetUserId);
  if (blocked) return { ok: false as const, error: "You can't message this user." };

  const id = await getOrCreateConversation(session.user.id, targetUserId);
  return { ok: true as const, id };
}

export async function sendMessage(conversationId: string, content: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Sign in to send messages." };
  if (blocksPosting(session.user.moderationStatus, session.user.moderationUntil)) {
    return { ok: false as const, error: "Your account can't send messages right now." };
  }

  const limits = await getRateLimitOverrides();
  const rateLimit = checkRateLimit(`message:${session.user.id}`, limits.message, RATE_LIMITS.message.windowMs);
  if (!rateLimit.ok) {
    return { ok: false as const, error: `You're sending messages too fast — try again in a bit.` };
  }

  const parsed = messageContentSchema.safeParse(content);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const trimmed = parsed.data;

  const userId = session.user.id;
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) return { ok: false as const, error: "Conversation not found." };

  const otherParticipant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: { not: userId } },
  });
  if (otherParticipant) {
    const blocked = await isBlockedEitherWay(userId, otherParticipant.userId);
    if (blocked) return { ok: false as const, error: "You can't send messages in this conversation." };
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({ data: { conversationId, senderId: userId, content: trimmed } }),
    prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
    prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    }),
  ]);

  if (otherParticipant) {
    await createNotification(otherParticipant.userId, "MESSAGE", { actorId: userId, conversationId }, userId);
  }

  return { ok: true as const, message: toMessageView(message) };
}

export async function markConversationRead(conversationId: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const };

  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: session.user.id },
    data: { lastReadAt: new Date() },
  });
  return { ok: true as const };
}

export async function toggleBlock(targetUserId: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Sign in." };
  if (session.user.id === targetUserId) return { ok: false as const, error: "You can't block yourself." };

  const blockerId = session.user.id;
  const existing = await prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId, blockedId: targetUserId } } });

  if (existing) {
    await prisma.block.delete({ where: { id: existing.id } });
    return { ok: true as const, blocked: false };
  }

  await prisma.block.create({ data: { blockerId, blockedId: targetUserId } });
  return { ok: true as const, blocked: true };
}
