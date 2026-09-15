import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewerContext, getMyUploads } from "@/lib/media/query";
import { MediaGrid, EmptyMediaState } from "@/components/media/MediaGrid";

export const metadata: Metadata = { title: "Your uploads" };

export default async function DashboardUploadsPage() {
  const viewer = await getViewerContext();
  if (!viewer.userId) redirect("/login?callbackUrl=/dashboard/uploads");

  const uploads = await getMyUploads(viewer.userId);
  const processingCount = uploads.filter((u) => u.status === "PROCESSING").length;

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
      <h1 className="text-4xl text-moonlight sm:text-5xl">Your uploads</h1>
      <p className="mt-3 text-sm text-ash">
        {uploads.length} total{processingCount > 0 ? ` · ${processingCount} still processing` : ""}
      </p>

      <div className="mt-8">
        {uploads.length > 0 ? (
          <MediaGrid items={uploads} />
        ) : (
          <EmptyMediaState message="You haven't uploaded anything yet." actionHref="/upload" actionLabel="Upload something" />
        )}
      </div>
    </div>
  );
}
