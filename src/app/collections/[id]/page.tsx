import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getCollectionById } from "@/lib/collections/queries";
import { getViewerContext } from "@/lib/media/query";
import { MediaGrid, EmptyMediaState } from "@/components/media/MediaGrid";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const viewer = await getViewerContext();
  const result = await getCollectionById(id, viewer);
  return { title: result?.collection.name ?? "Collection" };
}

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewerContext();
  const result = await getCollectionById(id, viewer);
  if (!result) notFound();

  const { collection, items } = result;
  const isOwner = viewer.userId === collection.ownerId;

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-3xl text-moonlight sm:text-4xl">{collection.name}</h1>
            {collection.visibility === "PRIVATE" ? (
              <span className="rounded-sm border border-white/20 px-2 py-0.5 text-xs font-bold text-ash">
                Private
              </span>
            ) : null}
          </div>
          {collection.description ? (
            <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-ash">{collection.description}</p>
          ) : null}
          <p className="mt-2 text-sm text-ash">
            By{" "}
            {collection.owner.username ? (
              <Link href={`/u/${collection.owner.username}`} className="text-moonlight hover:underline">
                {collection.owner.name ?? collection.owner.username}
              </Link>
            ) : (
              (collection.owner.name ?? "a deleted user")
            )}{" "}
            · {collection._count.items} items
          </p>
        </div>
        {isOwner ? (
          <Link href="/dashboard/collections" className="text-sm text-moonlight underline underline-offset-4">
            Manage collections
          </Link>
        ) : null}
      </div>

      <div className="mt-8">
        {items.length > 0 ? (
          <MediaGrid items={items} />
        ) : (
          <EmptyMediaState message="Nothing in this collection yet." />
        )}
      </div>
    </div>
  );
}
