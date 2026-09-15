import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProcessingPoller } from "./ProcessingPoller";

export default async function MediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const media = await prisma.media.findUnique({
    where: { id },
    include: { variants: true, uploader: true },
  });

  if (!media || media.deletedAt || media.status === "REMOVED") {
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

  const display = media.variants.find((v) => v.kind === "MEDIUM") ?? media.variants.find((v) => v.kind === "SMALL");

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8">
      <div className="flex items-center justify-center overflow-hidden rounded-md border border-white/[0.09] bg-charcoal">
        {display ? (
          // Self-hosted, already-optimized variant — a plain <img> avoids a
          // redundant second resize pass through next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={display.url} alt={media.title ?? ""} className="max-h-[75vh] w-auto" />
        ) : (
          <p className="p-8 text-ash">No preview available.</p>
        )}
      </div>
      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl text-moonlight">{media.title ?? "Untitled"}</h1>
        <span className="text-sm text-ash">
          {media.width}×{media.height} · {Math.round(media.fileSize / 1024)}KB
        </span>
      </div>
      <p className="mt-1 text-sm text-ash">Uploaded by {media.uploader?.name ?? "a deleted user"}</p>
    </div>
  );
}
