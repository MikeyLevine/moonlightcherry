"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/create";
import { profileUpdateSchema } from "@/lib/security/schemas";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getRateLimitOverrides } from "@/lib/site-settings";

export async function updateProfile(input: {
  username: string;
  bio: string;
  websiteUrl: string;
  twitterHandle: string;
  nsfwEnabled: boolean;
}) {
  const session = await auth();
  if (!session?.user) {
    return { ok: false as const, error: "Sign in to edit your profile." };
  }

  const limits = await getRateLimitOverrides();
  const rateLimit = checkRateLimit(
    `profile-update:${session.user.id}`,
    limits.profileUpdate,
    RATE_LIMITS.profileUpdate.windowMs
  );
  if (!rateLimit.ok) return { ok: false as const, error: "Too many profile updates — try again later." };

  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const { username, bio, websiteUrl, twitterHandle, nsfwEnabled } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (existing && existing.id !== session.user.id) {
    return { ok: false as const, error: "That username is already taken." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      username,
      bio: bio || null,
      websiteUrl: websiteUrl || null,
      twitterHandle: twitterHandle.replace(/^@/, "") || null,
      nsfwEnabled,
    },
  });

  return { ok: true as const };
}

export async function toggleFollow(targetUserId: string) {
  const session = await auth();
  if (!session?.user) {
    return { ok: false as const, error: "Sign in to follow." };
  }
  if (session.user.id === targetUserId) {
    return { ok: false as const, error: "You can't follow yourself." };
  }

  const followerId = session.user.id;
  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId: targetUserId } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return { ok: true as const, following: false };
  }

  await prisma.follow.create({ data: { followerId, followingId: targetUserId } });
  await createNotification(targetUserId, "FOLLOW", { actorId: followerId }, followerId);
  return { ok: true as const, following: true };
}
