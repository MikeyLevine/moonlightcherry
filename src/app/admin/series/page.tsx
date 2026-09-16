import type { Metadata } from "next";
import { listSeries } from "@/lib/taxonomy/queries";
import { AdminSeriesActions } from "@/components/admin/AdminSeriesActions";
import { NewSeriesForm } from "@/components/admin/NewSeriesForm";

export const metadata: Metadata = { title: "Series" };

export default async function AdminSeriesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const series = await listSeries({ q: q?.trim() || null, take: 200 });

  return (
    <div>
      <h1 className="text-3xl text-moonlight">Series</h1>
      <form action="/admin/series" method="get" className="mt-4 max-w-sm">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search series"
          className="w-full rounded-sm border border-white/15 bg-charcoal px-3 py-2 text-sm text-moonlight placeholder:text-ash focus:outline-none"
        />
      </form>

      <NewSeriesForm />

      <ul className="mt-6 flex flex-col divide-y divide-white/[0.09] border-y border-white/[0.09]">
        {series.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm text-moonlight">{s.name}</p>
              <p className="text-xs text-ash">
                {s.type} · {s._count.media} uploads · {s._count.characters} characters
              </p>
            </div>
            <AdminSeriesActions
              series={{ id: s.id, name: s.name, type: s.type, coverUrl: s.coverUrl, description: s.description }}
              otherSeries={series.filter((other) => other.id !== s.id).map((other) => ({ id: other.id, name: other.name }))}
            />
          </li>
        ))}
        {series.length === 0 ? <li className="py-4 text-sm text-ash">No series found.</li> : null}
      </ul>
    </div>
  );
}
