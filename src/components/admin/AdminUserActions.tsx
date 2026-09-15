"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ModerationStatus, Role } from "@prisma/client";
import { applyUserModeration, changeUserRole } from "@/lib/admin/actions";

const ROLES: Role[] = ["USER", "TRUSTED_UPLOADER", "MODERATOR", "ADMINISTRATOR", "OWNER"];
const STATUSES: ModerationStatus[] = ["ACTIVE", "WARNED", "MUTED", "TIMED_OUT", "RESTRICTED", "SUSPENDED", "BANNED"];
const fieldClasses = "rounded-sm border border-white/15 bg-charcoal px-2 py-1.5 text-xs text-moonlight focus:outline-none";

export function AdminUserActions({
  userId,
  currentRole,
  currentStatus,
}: {
  userId: string;
  currentRole: Role;
  currentStatus: ModerationStatus;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>(currentRole);
  const [status, setStatus] = useState<ModerationStatus>(currentStatus);
  const [reason, setReason] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApply() {
    setError(null);
    startTransition(async () => {
      if (role !== currentRole) {
        const result = await changeUserRole(userId, role);
        if (!result.ok) {
          setError(result.error);
          return;
        }
      }
      if (status !== currentStatus || reason) {
        const result = await applyUserModeration(userId, {
          status,
          reason,
          durationHours: durationHours ? Number(durationHours) : undefined,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-moonlight underline underline-offset-4">
        Manage
      </button>
    );
  }

  return (
    <div className="flex w-56 flex-col gap-2 rounded-md border border-white/10 bg-void p-3">
      <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={fieldClasses}>
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <select value={status} onChange={(e) => setStatus(e.target.value as ModerationStatus)} className={fieldClasses}>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason"
        className={`${fieldClasses} placeholder:text-ash`}
      />
      <input
        value={durationHours}
        onChange={(e) => setDurationHours(e.target.value)}
        placeholder="Duration in hours (optional)"
        type="number"
        min="0"
        className={`${fieldClasses} placeholder:text-ash`}
      />
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleApply}
          disabled={isPending}
          className="rounded-sm bg-cherry px-3 py-1.5 text-xs font-bold text-on-cherry disabled:opacity-50"
        >
          Apply
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-ash">
          Cancel
        </button>
      </div>
      {error ? <p className="text-xs text-ember">{error}</p> : null}
    </div>
  );
}
