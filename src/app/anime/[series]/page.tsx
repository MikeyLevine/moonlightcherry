import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSeriesBySlug } from "@/lib/taxonomy/queries";
import { getViewerContext, getMediaPage } from "@/lib/media/query";
import { MediaGrid, EmptyMediaState } from "@/components/media/MediaGrid";
import { ChipLink } from "@/components/ui/Chip";

export async function generateMetadata({ params }: { params: Promise<{ series: string }> }): Promise<Metadata> {
  const { series: slug } = await params;
  const record = await getSeriesBySlug(slug);
  return { title: record?.name ?? "Series" };
}

export default async function SeriesPage({ params }: { params: Promise<{ series: string }> }) {
  const { series: slug } = await params;
  const series = await getSeriesBySlug(slug);
  if (!series) notFound();

  const viewer = await getViewerContext();
  const page = await getMediaPage("recent", { viewer, take: 24, seriesSlug: slug });

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8">
      <h1 className="text-3xl text-moonlight sm:text-4xl">{series.name}</h1>
      <p className="mt-1 text-sm text-ash">{series.type.charAt(0) + series.type.slice(1).toLowerCase()}</p>

      {series.description ? (
        <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-ash">{series.description}</p>
      ) : null}

      {series.characters.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {series.characters.map((c) => (
            <ChipLink key={c.id} href={`/characters/${c.slug}`}>
              {c.name}
            </ChipLink>
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        {page.items.length > 0 ? (
          <MediaGrid items={page.items} />
        ) : (
          <EmptyMediaState message="No uploads for this series yet." />
        )}
      </div>
    </div>
  );
}
