import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTagBySlug, getRelatedTags } from "@/lib/taxonomy/queries";
import { getViewerContext, getMediaPage } from "@/lib/media/query";
import { MediaGrid, EmptyMediaState } from "@/components/media/MediaGrid";
import { ChipLink } from "@/components/ui/Chip";

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const record = await getTagBySlug(tag);
  return { title: record?.name ?? "Tag" };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const viewer = await getViewerContext();
  const [page, related] = await Promise.all([
    getMediaPage("recent", { viewer, take: 24, tagSlug: slug }),
    getRelatedTags(tag.id),
  ]);

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8">
      <h1 className="text-3xl text-moonlight sm:text-4xl">#{tag.name}</h1>
      <p className="mt-1 text-sm text-ash">{tag.usageCount} uploads</p>

      {related.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {related.map((r) => (
            <ChipLink key={r.id} href={`/tags/${r.slug}`}>
              {r.name}
            </ChipLink>
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        {page.items.length > 0 ? (
          <MediaGrid items={page.items} />
        ) : (
          <EmptyMediaState message="No uploads tagged with this yet." />
        )}
      </div>
    </div>
  );
}
