import type { Metadata } from "next";
import Link from "next/link";
import { listSeries } from "@/lib/taxonomy/queries";

export const metadata: Metadata = { title: "Anime" };

export default async function SeriesListPage() {
  const series = await listSeries({ take: 200 });

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
      <h1 className="text-4xl text-moonlight sm:text-5xl">Anime &amp; manga</h1>
      <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-ash">
        Browse art by series. Anyone can add a series while tagging their own upload.
      </p>

      {series.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {series.map((s) => (
            <Link
              key={s.id}
              href={`/anime/${s.slug}`}
              className="rounded-md border border-white/[0.09] bg-charcoal p-5 transition-colors hover:border-white/20"
            >
              <p className="font-display text-lg text-moonlight">{s.name}</p>
              <p className="mt-1 text-xs text-ash">
                {s.type.charAt(0) + s.type.slice(1).toLowerCase()} · {s._count.characters} characters ·{" "}
                {s._count.media} uploads
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-md border border-white/10 bg-charcoal px-6 py-10 text-center">
          <p className="text-sm text-ash">
            No series yet — uploaders can add one from their media page.
          </p>
        </div>
      )}
    </div>
  );
}
