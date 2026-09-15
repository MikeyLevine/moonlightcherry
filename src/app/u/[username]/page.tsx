import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getUserByUsername, isFollowing, getMostUsedTags } from "@/lib/users/queries";
import { getUserCollections } from "@/lib/collections/queries";
import { getViewerContext, getMediaPage } from "@/lib/media/query";
import { MediaGrid, EmptyMediaState } from "@/components/media/MediaGrid";
import { ChipLink } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { FollowButton } from "@/components/profile/FollowButton";
import { MessageButton } from "@/components/messaging/MessageButton";
import { formatCount } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);
  return { title: user ? `@${user.username}` : "Profile" };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) notFound();

  const viewer = await getViewerContext();
  const isOwnProfile = viewer.userId === user.id;

  const [following, mostUsedTags, mediaPage, collections] = await Promise.all([
    isOwnProfile ? Promise.resolve(false) : isFollowing(viewer.userId, user.id),
    getMostUsedTags(user.id),
    getMediaPage("recent", { viewer, take: 24, uploaderId: user.id }),
    getUserCollections(user.id, viewer),
  ]);

  const joined = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(user.createdAt);

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="h-20 w-20 shrink-0 rounded-full" />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-white/15 bg-charcoal font-display text-2xl text-moonlight">
              {(user.name ?? user.username ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl text-moonlight">{user.name ?? user.username}</h1>
            <p className="text-sm text-ash">@{user.username}</p>
            {user.bio ? <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-moonlight">{user.bio}</p> : null}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ash">
              <span>Joined {joined}</span>
              <span className="tabular-nums">{formatCount(user._count.followedBy)} followers</span>
              <span className="tabular-nums">{formatCount(user._count.following)} following</span>
              {user.websiteUrl ? (
                <a href={user.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-moonlight underline underline-offset-4">
                  Website
                </a>
              ) : null}
              {user.twitterHandle ? (
                <a
                  href={`https://x.com/${user.twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-moonlight underline underline-offset-4"
                >
                  @{user.twitterHandle}
                </a>
              ) : null}
            </div>
          </div>
        </div>

        {isOwnProfile ? (
          <Button href="/settings" variant="ghost">
            Edit profile
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <FollowButton targetUserId={user.id} isAuthenticated={Boolean(viewer.userId)} initialFollowing={following} />
            <MessageButton targetUserId={user.id} isAuthenticated={Boolean(viewer.userId)} />
          </div>
        )}
      </div>

      {mostUsedTags.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {mostUsedTags.map((tag) => (
            <ChipLink key={tag.id} href={`/tags/${tag.slug}`}>
              {tag.name}
            </ChipLink>
          ))}
        </div>
      ) : null}

      <div className="mt-8 border-t border-white/[0.09] pt-8">
        <h2 className="mb-5 text-xl text-moonlight">Uploads</h2>
        {mediaPage.items.length > 0 ? (
          <MediaGrid items={mediaPage.items} />
        ) : (
          <EmptyMediaState message={isOwnProfile ? "You haven't uploaded anything yet." : "No uploads yet."} />
        )}
      </div>

      {collections.length > 0 ? (
        <div className="mt-8 border-t border-white/[0.09] pt-8">
          <h2 className="mb-5 text-xl text-moonlight">Collections</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => {
              const coverVariant = c.items[0]?.media.variants.find(
                (v) => v.kind === "THUMBNAIL" || v.kind === "POSTER"
              );
              return (
                <Link
                  key={c.id}
                  href={`/collections/${c.id}`}
                  className="rounded-md border border-white/[0.09] bg-charcoal p-4 transition-colors hover:border-white/20"
                >
                  <div
                    className="mb-3 flex aspect-video items-center justify-center overflow-hidden rounded-sm bg-charcoal-2 bg-cover bg-center"
                    style={coverVariant ? { backgroundImage: `url(${coverVariant.url})` } : undefined}
                  />
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base text-moonlight">{c.name}</span>
                    {c.visibility === "PRIVATE" ? (
                      <span className="rounded-sm border border-white/20 px-1.5 py-0.5 text-[10px] font-bold text-ash">
                        Private
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-ash">{c._count.items} items</p>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <p className="mt-10 text-xs text-ash">Public favorites will show here once that&rsquo;s built.</p>
    </div>
  );
}
