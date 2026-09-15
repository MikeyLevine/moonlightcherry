import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCharacterBySlug } from "@/lib/taxonomy/queries";
import { getViewerContext, getMediaPage } from "@/lib/media/query";
import { MediaGrid, EmptyMediaState } from "@/components/media/MediaGrid";
import { ChipLink } from "@/components/ui/Chip";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ character: string }>;
}): Promise<Metadata> {
  const { character: slug } = await params;
  const record = await getCharacterBySlug(slug);
  return { title: record?.name ?? "Character" };
}

export default async function CharacterPage({ params }: { params: Promise<{ character: string }> }) {
  const { character: slug } = await params;
  const character = await getCharacterBySlug(slug);
  if (!character) notFound();

  const viewer = await getViewerContext();
  const page = await getMediaPage("recent", { viewer, take: 24, characterSlug: slug });

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/15 bg-charcoal font-display text-2xl text-moonlight">
          {character.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl text-moonlight sm:text-4xl">{character.name}</h1>
          {character.series ? (
            <ChipLink href={`/anime/${character.series.slug}`} className="mt-1.5 inline-flex">
              {character.series.name}
            </ChipLink>
          ) : null}
        </div>
      </div>

      {character.description ? (
        <p className="mt-5 max-w-[62ch] text-sm leading-relaxed text-ash">{character.description}</p>
      ) : null}

      <div className="mt-8">
        {page.items.length > 0 ? (
          <MediaGrid items={page.items} />
        ) : (
          <EmptyMediaState message="No uploads featuring this character yet." />
        )}
      </div>
    </div>
  );
}
