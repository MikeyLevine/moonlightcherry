import Link from "next/link";
import type { MediaCard } from "@/lib/media/query";
import { formatCount } from "@/lib/format";

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden="true">
      <path d="M12 21s-7-4.6-9.7-9C.6 8.7 2.2 5 5.6 5c2 0 3.4 1 4.4 2.6C11 6 12.4 5 14.4 5c3.4 0 5 3.7 3.3 7-2.7 4.4-9.7 9-9.7 9z" />
    </svg>
  );
}

export function MediaGrid({ items }: { items: MediaCard[] }) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
      {items.map((item) => (
        <MediaTile key={item.id} item={item} />
      ))}
    </div>
  );
}

function MediaTile({ item }: { item: MediaCard }) {
  const thumb = item.variants.find((v) => v.kind === "THUMBNAIL") ?? item.variants.find((v) => v.kind === "POSTER");
  const aspect = item.width && item.height ? `${item.width} / ${item.height}` : "4 / 5";

  return (
    <Link
      href={`/i/${item.id}`}
      className="group relative mb-4 block break-inside-avoid overflow-hidden rounded-md border border-white/[0.09] bg-charcoal-2"
      style={{ aspectRatio: aspect }}
    >
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb.url} alt={item.title ?? ""} className="h-full w-full object-cover" loading="lazy" />
      ) : null}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/75 to-transparent p-3.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        <p className="font-display truncate text-base text-moonlight">{item.title ?? "Untitled"}</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="truncate text-xs text-ash">
            by {item.uploader?.name ?? "a deleted user"}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-ash">
            <HeartIcon /> {formatCount(item.likeCount)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function EmptyMediaState({ message, actionHref, actionLabel }: { message: string; actionHref?: string; actionLabel?: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-charcoal px-6 py-10 text-center">
      <p className="text-sm text-ash">{message}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="mt-3 inline-block text-sm text-moonlight underline underline-offset-4">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
