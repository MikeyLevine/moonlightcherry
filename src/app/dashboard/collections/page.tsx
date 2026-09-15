import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewerContext } from "@/lib/media/query";
import { getUserCollections } from "@/lib/collections/queries";
import { CollectionManager } from "@/components/collections/CollectionManager";

export const metadata: Metadata = { title: "Collections" };

export default async function DashboardCollectionsPage() {
  const viewer = await getViewerContext();
  if (!viewer.userId) redirect("/login?callbackUrl=/dashboard/collections");

  const collections = await getUserCollections(viewer.userId, viewer);

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
      <h1 className="text-4xl text-moonlight sm:text-5xl">Your collections</h1>
      <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-ash">
        Organize your favorite uploads into public or private collections.
      </p>

      <CollectionManager
        initialCollections={collections.map((c) => {
          const coverVariant = c.items[0]?.media.variants.find(
            (v) => v.kind === "THUMBNAIL" || v.kind === "POSTER"
          );
          return {
            id: c.id,
            name: c.name,
            description: c.description,
            visibility: c.visibility,
            itemCount: c._count.items,
            coverUrl: coverVariant?.url ?? null,
          };
        })}
      />
    </div>
  );
}
