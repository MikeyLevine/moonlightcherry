import { notFound } from "next/navigation";
import { getViewerContext, getVisibleMediaById, getViewerEngagement } from "@/lib/media/query";
import { formatCount, formatRelativeTime } from "@/lib/format";
import { EngagementButtons } from "@/components/media/EngagementButtons";
import { ShareButton } from "@/components/media/ShareButton";
import { MediaLightbox } from "@/components/media/MediaLightbox";
import { ViewBeacon } from "@/components/media/ViewBeacon";
import { buttonBaseClasses, buttonVariantClasses } from "@/components/ui/Button";
import { ProcessingPoller } from "./ProcessingPoller";

export default async function MediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewerContext();
  const media = await getVisibleMediaById(id, viewer);

  if (!media) {
    notFound();
  }

  if (media.status === "PROCESSING") {
    return (
      <div className="mx-auto max-w-[1280px] px-5 py-24 sm:px-8">
        <h1 className="text-3xl text-moonlight">Processing…</h1>
        <p className="mt-3 max-w-[52ch] text-base text-ash">
          Your upload is being validated and resized. This page updates automatically once
          it&rsquo;s ready.
        </p>
        <ProcessingPoller />
      </div>
    );
  }

  const engagement = await getViewerEngagement(media.id, viewer.userId);

  const small = media.variants.find((v) => v.kind === "SMALL");
  const medium = media.variants.find((v) => v.kind === "MEDIUM");
  const poster = media.variants.find((v) => v.kind === "POSTER");
  const original = media.variants.find((v) => v.kind === "ORIGINAL");
  const display = medium ?? small ?? poster;

  const srcSetParts = [small, medium]
    .filter((v): v is NonNullable<typeof v> => Boolean(v))
    .map((v) => `${v.url} ${v.width}w`);

  const downloadName = `moonlightcherry-${media.id}.${original?.format ?? "jpg"}`;

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8">
      <ViewBeacon mediaId={media.id} />

      <div className="flex items-center justify-center overflow-hidden rounded-md border border-white/[0.09] bg-charcoal">
        {display ? (
          <MediaLightbox
            src={display.url}
            srcSet={srcSetParts.length > 0 ? srcSetParts.join(", ") : undefined}
            original={original?.url ?? display.url}
            alt={media.title ?? ""}
          />
        ) : (
          <p className="p-8 text-ash">No preview available.</p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl text-moonlight">{media.title ?? "Untitled"}</h1>
            {media.nsfw ? (
              <span className="rounded-sm border border-cherry px-2 py-0.5 text-xs font-bold text-cherry">
                NSFW
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-ash">
            Uploaded by {media.uploader?.name ?? "a deleted user"} · {formatRelativeTime(media.createdAt)} ·{" "}
            {formatCount(media.viewCount)} views
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <EngagementButtons
            mediaId={media.id}
            isAuthenticated={Boolean(viewer.userId)}
            initialLiked={engagement.liked}
            initialLikeCount={media.likeCount}
            initialFavorited={engagement.favorited}
            initialFavoriteCount={media.favoriteCount}
          />
          <ShareButton title={media.title ?? "Moonlight Cherry"} />
          {original ? (
            <a
              href={original.url}
              download={downloadName}
              className={`${buttonBaseClasses} ${buttonVariantClasses.ghost}`}
            >
              Download
            </a>
          ) : null}
        </div>
      </div>

      <p className="mt-4 text-sm text-ash">
        {media.width}×{media.height} · {Math.round(media.fileSize / 1024)}KB
      </p>
    </div>
  );
}
