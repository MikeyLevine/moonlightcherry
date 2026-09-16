import type { Metadata } from "next";
import { listTags } from "@/lib/taxonomy/queries";
import { AdminTagActions } from "@/components/admin/AdminTagActions";

export const metadata: Metadata = { title: "Tags" };

export default async function AdminTagsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const tags = await listTags({ q: q?.trim() || null, take: 200 });

  return (
    <div>
      <h1 className="text-3xl text-moonlight">Tags</h1>
      <form action="/admin/tags" method="get" className="mt-4 max-w-sm">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search tags"
          className="w-full rounded-sm border border-white/15 bg-charcoal px-3 py-2 text-sm text-moonlight placeholder:text-ash focus:outline-none"
        />
      </form>

      <ul className="mt-6 flex flex-col divide-y divide-white/[0.09] border-y border-white/[0.09]">
        {tags.map((tag) => (
          <li key={tag.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm text-moonlight">#{tag.name}</p>
              <p className="text-xs text-ash">{tag.usageCount} uploads</p>
            </div>
            <AdminTagActions
              tagId={tag.id}
              currentName={tag.name}
              otherTags={tags.filter((t) => t.id !== tag.id).map((t) => ({ id: t.id, name: t.name }))}
            />
          </li>
        ))}
        {tags.length === 0 ? <li className="py-4 text-sm text-ash">No tags found.</li> : null}
      </ul>
    </div>
  );
}
