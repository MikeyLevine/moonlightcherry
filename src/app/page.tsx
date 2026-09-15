import Link from "next/link";
import { SearchField } from "@/components/ui/SearchField";
import { ChipLink } from "@/components/ui/Chip";
import { MediaGrid, EmptyMediaState } from "@/components/media/MediaGrid";
import {
  getViewerContext,
  getTrendingMedia,
  getRecentMedia,
  getMostLikedMedia,
  getPopularCategories,
} from "@/lib/media/query";

export default async function HomePage() {
  const viewer = await getViewerContext();

  const [trending, recent, mostLiked, categories] = await Promise.all([
    getTrendingMedia({ viewer, take: 8 }),
    getRecentMedia({ viewer, take: 8 }),
    getMostLikedMedia({ viewer, take: 8 }),
    getPopularCategories(),
  ]);

  return (
    <div>
      <section className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 sm:py-20">
        <div className="max-w-[46ch]">
          <h1 className="text-4xl leading-[1.05] text-moonlight sm:text-5xl">
            Anime art, <em className="text-ember">after dark.</em>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ash">
            Fan art, official art, and wallpapers from a community that never logs off. Browse
            without an account, or sign in to save what you love.
          </p>
          <form action="/search" method="get" className="mt-7">
            <SearchField
              id="home-search"
              name="q"
              placeholder="Search characters, series, or tags"
            />
          </form>
        </div>
      </section>

      {categories.length > 0 ? (
        <section className="mx-auto max-w-[1280px] px-5 pb-4 sm:px-8">
          <div className="flex flex-wrap gap-2.5">
            {categories.map((category) => (
              <ChipLink key={category.id} href={`/gallery?category=${category.slug}`}>
                {category.name}
                {category._count.media > 0 ? (
                  <span className="ml-1.5 text-ash">{category._count.media}</span>
                ) : null}
              </ChipLink>
            ))}
          </div>
        </section>
      ) : null}

      <HomeSection title="Trending now" seeAllHref="/gallery?sort=trending" items={trending.items} />
      <HomeSection title="Recently uploaded" seeAllHref="/gallery?sort=recent" items={recent.items} />
      <HomeSection title="Most liked" seeAllHref="/gallery?sort=most-liked" items={mostLiked.items} />
    </div>
  );
}

function HomeSection({
  title,
  seeAllHref,
  items,
}: {
  title: string;
  seeAllHref: string;
  items: Awaited<ReturnType<typeof getTrendingMedia>>["items"];
}) {
  return (
    <section className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h2 className="text-xl text-moonlight sm:text-2xl">{title}</h2>
        <Link href={seeAllHref} className="shrink-0 text-sm text-ash hover:text-moonlight">
          See all
        </Link>
      </div>
      {items.length > 0 ? (
        <MediaGrid items={items} />
      ) : (
        <EmptyMediaState
          message="Nothing here yet — uploads will show up as soon as they're published."
          actionHref="/upload"
          actionLabel="Upload the first one"
        />
      )}
    </section>
  );
}
