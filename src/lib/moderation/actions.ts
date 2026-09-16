"use server";

import type { ReportCategory, ReportTargetType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reportDetailsSchema } from "@/lib/security/schemas";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getRateLimitOverrides } from "@/lib/site-settings";

export async function submitReport(input: {
  targetType: ReportTargetType;
  targetId: string;
  category: ReportCategory;
  details: string;
}) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Sign in to report this." };

  const limits = await getRateLimitOverrides();
  const perUser = checkRateLimit(`report:${session.user.id}`, limits.report, RATE_LIMITS.report.windowMs);
  if (!perUser.ok) return { ok: false as const, error: "You've filed a lot of reports recently — try again later." };

  const ip = await getClientIp();
  const perIp = checkRateLimit(`report-ip:${ip}`, limits.reportPerIp, RATE_LIMITS.reportPerIp.windowMs);
  if (!perIp.ok) return { ok: false as const, error: "Too many reports from this network — try again later." };

  const parsed = reportDetailsSchema.safeParse(input.details);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };

  await prisma.report.create({
    data: {
      reporterId: session.user.id,
      targetType: input.targetType,
      targetId: input.targetId,
      category: input.category,
      details: parsed.data || null,
    },
  });

  return { ok: true as const };
}
