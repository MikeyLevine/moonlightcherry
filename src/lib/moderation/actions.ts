"use server";

import type { ReportCategory, ReportTargetType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function submitReport(input: {
  targetType: ReportTargetType;
  targetId: string;
  category: ReportCategory;
  details: string;
}) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Sign in to report this." };

  await prisma.report.create({
    data: {
      reporterId: session.user.id,
      targetType: input.targetType,
      targetId: input.targetId,
      category: input.category,
      details: input.details.trim() || null,
    },
  });

  return { ok: true as const };
}
