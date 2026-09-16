"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isModerator } from "@/lib/admin/permissions";
import { SETTINGS_REGISTRY, saveSiteSettings, type SettingKey } from "@/lib/site-settings";

export async function updateSiteSettings(values: Record<string, string>) {
  const session = await auth();
  if (!session?.user || !isModerator(session.user.role)) {
    return { ok: false as const, error: "You don't have permission to do that." };
  }

  const parsed: Partial<Record<SettingKey, number>> = {};
  for (const setting of SETTINGS_REGISTRY) {
    const raw = values[setting.key];
    if (raw === undefined) continue;
    const num = Number(raw);
    if (!Number.isFinite(num)) return { ok: false as const, error: `${setting.label} must be a number.` };
    if (setting.min !== undefined && num < setting.min) {
      return { ok: false as const, error: `${setting.label} must be at least ${setting.min}.` };
    }
    if ("max" in setting && setting.max !== undefined && num > setting.max) {
      return { ok: false as const, error: `${setting.label} must be at most ${setting.max}.` };
    }
    parsed[setting.key] = num;
  }

  await saveSiteSettings(parsed);
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "settings.update", targetType: "site_settings", targetId: "global" },
  });

  return { ok: true as const };
}
