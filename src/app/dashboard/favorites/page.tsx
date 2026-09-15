import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewerContext, getMediaPage } from "@/lib/media/query";
import { MediaGrid, EmptyMediaState } from "@/components/media/MediaGrid";

export const metadata: Metadata = { title: "Your favorites" };

export default async function DashboardFavoritesPage() {
  const viewer = await getViewerContext();
  if (!viewer.userId) redirect("/login?callbackUrl=/dashboard/favorites");

  const page = await getMediaPage("recent", { viewer, take: 48, favoritedByUserId: viewer.userId });

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
      <h1 className="text-4xl text-moonlight sm:text-5xl">Your favorites</h1>

      <div className="mt-8">
        {page.items.length > 0 ? (
          <MediaGrid items={page.items} />
        ) : (
          <EmptyMediaState message="Nothing favorited yet." actionHref="/gallery" actionLabel="Browse the gallery" />
        )}
      </div>
    </div>
  );
}
