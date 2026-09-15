"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/create";

const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;

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

  const username = input.username.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) {
    return {
      ok: false as const,
      error: "Username must be 3-30 characters: lowercase letters, numbers, and hyphens only.",
    };
  }

  const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (existing && existing.id !== session.user.id) {
    return { ok: false as const, error: "That username is already taken." };
  }

  const websiteUrl = input.websiteUrl.trim();
  if (websiteUrl && !/^https?:\/\/.+/.test(websiteUrl)) {
    return { ok: false as const, error: "Website URL must start with http:// or https://." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      username,
      bio: input.bio.trim() || null,
      websiteUrl: websiteUrl || null,
      twitterHandle: input.twitterHandle.trim().replace(/^@/, "") || null,
      nsfwEnabled: input.nsfwEnabled,
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
