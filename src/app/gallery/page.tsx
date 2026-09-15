import type { Metadata } from "next";
import { ChipLink } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { InfiniteMediaGrid } from "@/components/media/InfiniteMediaGrid";
import { EmptyMediaState } from "@/components/media/MediaGrid";
import { getViewerContext, getMediaPage, getPopularCategories, type MediaSort } from "@/lib/media/query";

export const metadata: Metadata = { title: "Gallery" };

const SORTS: { value: MediaSort; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "recent", label: "Recent" },
  { value: "most-liked", label: "Most liked" },
];

const VALID_SORTS = SORTS.map((s) => s.value);

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; category?: string }>;
}) {
  const params = await searchParams;
  const sort: MediaSort = VALID_SORTS.includes(params.sort as MediaSort) ? (params.sort as MediaSort) : "trending";
  const categorySlug = params.category ?? null;

  const viewer = await getViewerContext();
  const [page, categories] = await Promise.all([
    getMediaPage(sort, { viewer, take: 24, categorySlug }),
    getPopularCategories(),
  ]);

  const buildHref = (overrides: { sort?: MediaSort; category?: string | null }) => {
    const next = new URLSearchParams();
    next.set("sort", overrides.sort ?? sort);
    const cat = overrides.category !== undefined ? overrides.category : categorySlug;
    if (cat) next.set("category", cat);
    return `/gallery?${next.toString()}`;
  };

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl text-moonlight sm:text-4xl">Gallery</h1>
        <Button href="/gallery/random" variant="ghost">
          Random
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2.5">
        {SORTS.map((s) => (
          <ChipLink key={s.value} href={buildHref({ sort: s.value })} active={s.value === sort}>
            {s.label}
          </ChipLink>
        ))}
      </div>

      <div className="mb-8 flex flex-wrap gap-2.5 border-t border-white/[0.09] pt-4">
        <ChipLink href={buildHref({ category: null })} active={!categorySlug}>
          All
        </ChipLink>
        {categories.map((category) => (
          <ChipLink key={category.id} href={buildHref({ category: category.slug })} active={category.slug === categorySlug}>
            {category.name}
          </ChipLink>
        ))}
      </div>

      {page.items.length > 0 ? (
        <InfiniteMediaGrid
          key={`${sort}-${categorySlug}`}
          initialItems={page.items}
          initialCursor={page.nextCursor}
          sort={sort}
          categorySlug={categorySlug}
        />
      ) : (
        <EmptyMediaState
          message="No uploads match this filter yet."
          actionHref="/upload"
          actionLabel="Upload something"
        />
      )}
    </div>
  );
}
