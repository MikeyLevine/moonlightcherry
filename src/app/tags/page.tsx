import type { Metadata } from "next";
import { ChipLink } from "@/components/ui/Chip";
import { listTags } from "@/lib/taxonomy/queries";

export const metadata: Metadata = { title: "Tags" };

export default async function TagsPage() {
  const tags = await listTags({ take: 200 });

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
      <h1 className="text-4xl text-moonlight sm:text-5xl">Tags</h1>
      <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-ash">
        Browse by tag. Tags are created by uploaders as they describe their own work — the more
        specific, the better.
      </p>

      {tags.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-2.5">
          {tags.map((tag) => (
            <ChipLink key={tag.id} href={`/tags/${tag.slug}`}>
              {tag.name}
              <span className="ml-1.5 text-ash">{tag.usageCount}</span>
            </ChipLink>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-md border border-white/10 bg-charcoal px-6 py-10 text-center">
          <p className="text-sm text-ash">
            No tags yet — uploaders can add tags to their own work from the media page.
          </p>
        </div>
      )}
    </div>
  );
}
