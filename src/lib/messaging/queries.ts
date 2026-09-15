import { prisma } from "@/lib/prisma";

const PARTICIPANT_USER_SELECT = { id: true, name: true, username: true, image: true } as const;

export type MessageView = { id: string; content: string; createdAt: string; senderId: string | null };

export function toMessageView(m: { id: string; content: string; createdAt: Date; senderId: string | null }): MessageView {
  return { id: m.id, content: m.content, createdAt: m.createdAt.toISOString(), senderId: m.senderId };
}

/** Bidirectional — either party having blocked the other cuts off sending. */
export async function isBlockedEitherWay(userAId: string, userBId: string): Promise<boolean> {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userAId, blockedId: userBId },
        { blockerId: userBId, blockedId: userAId },
      ],
    },
  });
  return Boolean(block);
}

/** Directional — used to label the button "Block" vs "Unblock" correctly. */
export async function isBlockingUser(blockerId: string, blockedId: string): Promise<boolean> {
  const block = await prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId, blockedId } } });
  return Boolean(block);
}

async function findDirectConversation(userAId: string, userBId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: userAId } } },
    include: { participants: true },
  });
  return (
    conversations.find((c) => c.participants.length === 2 && c.participants.some((p) => p.userId === userBId)) ??
    null
  );
}

export async function getOrCreateConversation(userAId: string, userBId: string): Promise<string> {
  const existing = await findDirectConversation(userAId, userBId);
  if (existing) return existing.id;

  const conversation = await prisma.conversation.create({
    data: { participants: { create: [{ userId: userAId }, { userId: userBId }] } },
  });
  return conversation.id;
}

export type ConversationSummary = {
  id: string;
  other: { id: string; name: string | null; username: string | null; image: string | null } | null;
  lastMessage: { content: string; createdAt: Date } | null;
  unread: boolean;
  updatedAt: Date;
};

export async function getConversationsForUser(userId: string): Promise<ConversationSummary[]> {
  const participants = await prisma.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          participants: { include: { user: { select: PARTICIPANT_USER_SELECT } } },
          messages: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { conversation: { updatedAt: "desc" } },
  });

  return participants.map((p) => {
    const other = p.conversation.participants.find((pp) => pp.userId !== userId)?.user ?? null;
    const lastMessage = p.conversation.messages[0];
    const unread = Boolean(
      lastMessage && lastMessage.senderId !== userId && (!p.lastReadAt || lastMessage.createdAt > p.lastReadAt)
    );
    return {
      id: p.conversation.id,
      other,
      lastMessage: lastMessage ? { content: lastMessage.content, createdAt: lastMessage.createdAt } : null,
      unread,
      updatedAt: p.conversation.updatedAt,
    };
  });
}

export async function getConversationWithOther(conversationId: string, viewerId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: { include: { user: { select: PARTICIPANT_USER_SELECT } } } },
  });
  if (!conversation) return null;

  const viewerIsParticipant = conversation.participants.some((p) => p.userId === viewerId);
  if (!viewerIsParticipant) return null;

  const other = conversation.participants.find((p) => p.userId !== viewerId)?.user ?? null;
  return { other };
}

/** Returns null if the viewer isn't a participant — the route should 404, not
 * show someone else's conversation. */
export async function getConversationMessages(conversationId: string, viewerId: string): Promise<MessageView[] | null> {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: viewerId } },
  });
  if (!participant) return null;

  const messages = await prisma.message.findMany({
    where: { conversationId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  return messages.map(toMessageView);
}
