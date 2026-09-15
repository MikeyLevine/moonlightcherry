import type { Metadata } from "next";
import Link from "next/link";
import { searchMediaAdmin } from "@/lib/admin/queries";
import { AdminMediaActions } from "@/components/admin/AdminMediaActions";

export const metadata: Metadata = { title: "Media" };

export default async function AdminMediaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const media = await searchMediaAdmin(q?.trim() || null);

  return (
    <div>
      <h1 className="text-3xl text-moonlight">Media</h1>
      <form action="/admin/media" method="get" className="mt-4 max-w-sm">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by title"
          className="w-full rounded-sm border border-white/15 bg-charcoal px-3 py-2 text-sm text-moonlight placeholder:text-ash focus:outline-none"
        />
      </form>

      <ul className="mt-6 flex flex-col divide-y divide-white/[0.09] border-y border-white/[0.09]">
        {media.map((m) => {
          const thumb = m.variants.find((v) => v.kind === "THUMBNAIL" || v.kind === "POSTER");
          return (
            <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb.url} alt="" className="h-12 w-12 rounded-sm object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-sm bg-charcoal-2" />
              )}
              <div className="min-w-0 flex-1">
                <Link href={`/i/${m.id}`} className="text-sm text-moonlight hover:underline">
                  {m.title ?? "Untitled"}
                </Link>
                <p className="text-xs text-ash">
                  by {m.uploader?.name ?? m.uploader?.username ?? "a deleted user"} · {m.status}
                  {m.nsfw ? " · NSFW" : ""}
                  {m.featured ? " · Featured" : ""}
                </p>
              </div>
              <AdminMediaActions mediaId={m.id} status={m.status} featured={m.featured} />
            </li>
          );
        })}
        {media.length === 0 ? <li className="py-4 text-sm text-ash">No media found.</li> : null}
      </ul>
    </div>
  );
}
