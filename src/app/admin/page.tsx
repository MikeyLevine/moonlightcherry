import type { Metadata } from "next";
import { getDashboardStats } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const tiles = [
    { label: "Users", value: stats.userCount },
    { label: "Signups (7d)", value: stats.recentSignups },
    { label: "Media", value: stats.mediaCount },
    { label: "Published", value: stats.publishedCount },
    { label: "Open reports", value: stats.openReportCount },
  ];

  return (
    <div>
      <h1 className="text-3xl text-moonlight">Admin dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-md border border-white/[0.09] bg-charcoal p-5">
            <p className="font-display text-3xl tabular-nums text-moonlight">{t.value}</p>
            <p className="mt-1 text-sm text-ash">{t.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-md border border-white/[0.09] bg-charcoal p-5">
        <p className="text-sm font-bold text-moonlight">Storage</p>
        <p className="mt-1 text-sm text-ash">
          {stats.storage.usedPercent.toFixed(1)}% used
          {stats.storage.overBlockThreshold
            ? " — uploads are currently blocked"
            : stats.storage.overWarnThreshold
              ? " — approaching the configured limit"
              : ""}
        </p>
      </div>
    </div>
  );
}
