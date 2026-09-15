import type { Metadata } from "next";
import { listReports } from "@/lib/admin/queries";
import { ReportActions } from "@/components/admin/ReportActions";
import { formatRelativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  const reports = await listReports("OPEN");

  return (
    <div>
      <h1 className="text-3xl text-moonlight">Reports</h1>

      {reports.length === 0 ? (
        <p className="mt-6 text-sm text-ash">No open reports.</p>
      ) : (
        <ul className="mt-6 flex flex-col divide-y divide-white/[0.09] border-y border-white/[0.09]">
          {reports.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="text-sm text-moonlight">
                  <span className="font-bold">{r.category}</span> on {r.targetType.toLowerCase()}: {r.targetLabel}
                </p>
                <p className="mt-1 text-xs text-ash">
                  Reported by {r.reporter?.name ?? r.reporter?.username ?? "a deleted user"} ·{" "}
                  {formatRelativeTime(r.createdAt)}
                </p>
                {r.details ? <p className="mt-1 text-xs text-ash">&ldquo;{r.details}&rdquo;</p> : null}
              </div>
              <ReportActions reportId={r.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
