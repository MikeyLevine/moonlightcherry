import type { Metadata } from "next";
import Link from "next/link";
import { SearchField } from "@/components/ui/SearchField";
import { ChipLink } from "@/components/ui/Chip";
import { MediaGrid } from "@/components/media/MediaGrid";
import { getViewerContext, getMediaPage } from "@/lib/media/query";
import { listTags, listCharacters, listSeries } from "@/lib/taxonomy/queries";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || null;

  if (!query) {
    return (
      <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
        <h1 className="text-4xl text-moonlight sm:text-5xl">Search</h1>
        <form action="/search" method="get" className="mt-6 max-w-md">
          <SearchField id="search-field" name="q" placeholder="Search characters, series, tags, uploaders…" />
        </form>
      </div>
    );
  }

  const viewer = await getViewerContext();
  const [mediaPage, tags, characters, series] = await Promise.all([
    getMediaPage("recent", { viewer, take: 24, searchQuery: query }),
    listTags({ take: 12, q: query }),
    listCharacters({ take: 12, q: query }),
    listSeries({ take: 12, q: query }),
  ]);

  const nothingFound = mediaPage.items.length === 0 && tags.length === 0 && characters.length === 0 && series.length === 0;

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
      <h1 className="text-4xl text-moonlight sm:text-5xl">Search</h1>
      <form action="/search" method="get" className="mt-6 max-w-md">
        <SearchField id="search-field" name="q" placeholder="Search characters, series, tags, uploaders…" defaultValue={query} />
      </form>

      {nothingFound ? (
        <p className="mt-10 text-sm text-ash">Nothing matched &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="mt-10 flex flex-col gap-10">
          {characters.length > 0 ? (
            <section>
              <h2 className="mb-3 text-lg text-moonlight">Characters</h2>
              <div className="flex flex-wrap gap-2">
                {characters.map((c) => (
                  <ChipLink key={c.id} href={`/characters/${c.slug}`}>
                    {c.name}
                  </ChipLink>
                ))}
              </div>
            </section>
          ) : null}

          {series.length > 0 ? (
            <section>
              <h2 className="mb-3 text-lg text-moonlight">Anime &amp; manga</h2>
              <div className="flex flex-wrap gap-2">
                {series.map((s) => (
                  <ChipLink key={s.id} href={`/anime/${s.slug}`}>
                    {s.name}
                  </ChipLink>
                ))}
              </div>
            </section>
          ) : null}

          {tags.length > 0 ? (
            <section>
              <h2 className="mb-3 text-lg text-moonlight">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <ChipLink key={t.id} href={`/tags/${t.slug}`}>
                    {t.name}
                  </ChipLink>
                ))}
              </div>
            </section>
          ) : null}

          {mediaPage.items.length > 0 ? (
            <section>
              <h2 className="mb-3 text-lg text-moonlight">Uploads</h2>
              <MediaGrid items={mediaPage.items} />
            </section>
          ) : null}
        </div>
      )}

      <p className="mt-10 text-xs text-ash">
        Search matches titles and uploader names right now — full filtering by sort, category,
        and NSFW eligibility together lives on{" "}
        <Link href="/gallery" className="underline underline-offset-4">
          the gallery
        </Link>
        .
      </p>
    </div>
  );
}
