"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveReport } from "@/lib/admin/actions";

export function ReportActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handle(status: "RESOLVED" | "REJECTED") {
    startTransition(async () => {
      await resolveReport(reportId, status);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => handle("RESOLVED")}
        disabled={isPending}
        className="text-xs text-moonlight underline underline-offset-4"
      >
        Resolve
      </button>
      <button
        type="button"
        onClick={() => handle("REJECTED")}
        disabled={isPending}
        className="text-xs text-ash underline underline-offset-4"
      >
        Reject
      </button>
    </div>
  );
}
