"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ReportCategory, ReportTargetType } from "@prisma/client";
import { submitReport } from "@/lib/moderation/actions";

const CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: "ILLEGAL", label: "Illegal / prohibited content" },
  { value: "HARASSMENT", label: "Harassment" },
  { value: "SPAM", label: "Spam" },
  { value: "COPYRIGHT", label: "Copyright" },
  { value: "METADATA", label: "Incorrect metadata" },
  { value: "OTHER", label: "Other" },
];

export function ReportButton({
  targetType,
  targetId,
  isAuthenticated,
}: {
  targetType: ReportTargetType;
  targetId: string;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ReportCategory>("OTHER");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function handleOpen() {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setOpen((v) => !v);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    const result = await submitReport({ targetType, targetId, category, details });
    if (result.ok) {
      setStatus("done");
    } else {
      setStatus("error");
      setError(result.error);
    }
  }

  if (status === "done") {
    return <p className="text-sm text-ash">Report submitted. Thanks for flagging it.</p>;
  }

  return (
    <div>
      <button type="button" onClick={handleOpen} className="text-sm text-ash underline underline-offset-4 hover:text-moonlight">
        Report
      </button>

      {open ? (
        <form onSubmit={handleSubmit} className="mt-3 flex max-w-sm flex-col gap-3 rounded-md border border-white/10 bg-charcoal p-4">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ReportCategory)}
            className="rounded-sm border border-white/15 bg-void px-3 py-2 text-sm text-moonlight focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={2}
            placeholder="Details (optional)"
            className="rounded-sm border border-white/15 bg-void px-3 py-2 text-sm text-moonlight placeholder:text-ash focus:outline-none"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="rounded-sm bg-cherry px-4 py-2 text-sm font-bold text-on-cherry disabled:opacity-50"
            >
              {status === "submitting" ? "Submitting…" : "Submit report"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-ash">
              Cancel
            </button>
          </div>
          {error ? <p className="text-sm text-ember">{error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
