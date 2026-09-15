import type { Prisma, Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ViewerContext = {
  userId: string | null;
  canSeeNsfw: boolean;
  role: Role | null;
};

const EDITOR_ROLES: Role[] = ["MODERATOR", "ADMINISTRATOR", "OWNER"];

/**
 * The one place that decides whether the current request can see NSFW media.
 * Every surface that lists or fetches media must go through this — never
 * write an ad hoc query against the Media table for a list/detail view.
 */
export async function getViewerContext(): Promise<ViewerContext> {
  const session = await auth();
  return {
    userId: session?.user?.id ?? null,
    canSeeNsfw: Boolean(session?.user?.nsfwEnabled),
    role: session?.user?.role ?? null,
  };
}

export function canEditMedia(viewer: ViewerContext, uploaderId: string | null): boolean {
  if (!viewer.userId) return false;
  if (viewer.userId === uploaderId) return true;
  return viewer.role !== null && EDITOR_ROLES.includes(viewer.role);
}

/** The shared visibility filter: published, not soft-deleted, and NSFW-gated. */
export function visibleMediaWhere(viewer: ViewerContext): Prisma.MediaWhereInput {
  return {
    status: "PUBLISHED",
    deletedAt: null,
    ...(viewer.canSeeNsfw ? {} : { nsfw: false }),
  };
}

export const CARD_SELECT = {
  id: true,
  title: true,
  width: true,
  height: true,
  nsfw: true,
  likeCount: true,
  favoriteCount: true,
  commentCount: true,
  createdAt: true,
  uploader: { select: { id: true, name: true, username: true } },
  variants: { where: { kind: { in: ["THUMBNAIL", "POSTER"] } } },
} satisfies Prisma.MediaSelect;

export type MediaCard = Prisma.MediaGetPayload<{ select: typeof CARD_SELECT }>;

export type MediaSort = "trending" | "recent" | "most-liked";

type ListOptions = {
  viewer: ViewerContext;
  take?: number;
  cursor?: string | null;
  categorySlug?: string | null;
  tagSlug?: string | null;
  characterSlug?: string | null;
  seriesSlug?: string | null;
  uploaderId?: string | null;
  favoritedByUserId?: string | null;
  likedByUserId?: string | null;
  /** Matches title OR uploader name/username — covers "search by uploader"
   * without needing profile pages (Phase 8) to exist yet. */
  searchQuery?: string | null;
};

export async function getMediaPage(
  sort: MediaSort,
  options: ListOptions
): Promise<{ items: MediaCard[]; nextCursor: string | null }> {
  const {
    viewer,
    take = 24,
    cursor = null,
    categorySlug = null,
    tagSlug = null,
    characterSlug = null,
    seriesSlug = null,
    uploaderId = null,
    favoritedByUserId = null,
    likedByUserId = null,
    searchQuery = null,
  } = options;

  const where: Prisma.MediaWhereInput = {
    ...visibleMediaWhere(viewer),
    ...(categorySlug ? { categories: { some: { category: { slug: categorySlug } } } } : {}),
    ...(tagSlug ? { tags: { some: { tag: { slug: tagSlug } } } } : {}),
    ...(characterSlug ? { characters: { some: { character: { slug: characterSlug } } } } : {}),
    ...(seriesSlug ? { series: { some: { series: { slug: seriesSlug } } } } : {}),
    ...(uploaderId ? { uploaderId } : {}),
    ...(favoritedByUserId ? { favorites: { some: { userId: favoritedByUserId } } } : {}),
    ...(likedByUserId ? { likes: { some: { userId: likedByUserId } } } : {}),
    ...(searchQuery
      ? {
          OR: [
            { title: { contains: searchQuery, mode: "insensitive" } },
            { uploader: { name: { contains: searchQuery, mode: "insensitive" } } },
            { uploader: { username: { contains: searchQuery, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.MediaOrderByWithRelationInput[] =
    sort === "trending"
      ? [{ trendingScore: "desc" }, { id: "desc" }]
      : sort === "most-liked"
        ? [{ likeCount: "desc" }, { id: "desc" }]
        : [{ createdAt: "desc" }, { id: "desc" }];

  const items = await prisma.media.findMany({
    where,
    orderBy,
    take: take + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: CARD_SELECT,
  });

  const hasMore = items.length > take;
  const page = hasMore ? items.slice(0, take) : items;

  return { items: page, nextCursor: hasMore ? page[page.length - 1].id : null };
}

export function getTrendingMedia(options: ListOptions) {
  return getMediaPage("trending", options);
}

export function getRecentMedia(options: ListOptions) {
  return getMediaPage("recent", options);
}

export function getMostLikedMedia(options: ListOptions) {
  return getMediaPage("most-liked", options);
}

const OWN_UPLOAD_SELECT = {
  ...CARD_SELECT,
  status: true,
} satisfies Prisma.MediaSelect;

export type OwnUploadCard = Prisma.MediaGetPayload<{ select: typeof OWN_UPLOAD_SELECT }>;

/** A user's own uploads in every status (including still-PROCESSING) — a
 * management view, not a public listing, so it deliberately doesn't go
 * through visibleMediaWhere(). */
export async function getMyUploads(userId: string): Promise<OwnUploadCard[]> {
  return prisma.media.findMany({
    where: { uploaderId: userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: OWN_UPLOAD_SELECT,
  });
}

export async function getRandomMediaId(viewer: ViewerContext): Promise<string | null> {
  const where = visibleMediaWhere(viewer);
  const count = await prisma.media.count({ where });
  if (count === 0) return null;

  const skip = Math.floor(Math.random() * count);
  const [row] = await prisma.media.findMany({ where, select: { id: true }, take: 1, skip });
  return row?.id ?? null;
}

export async function getViewerEngagement(
  mediaId: string,
  userId: string | null
): Promise<{ liked: boolean; favorited: boolean }> {
  if (!userId) return { liked: false, favorited: false };

  const [like, favorite] = await Promise.all([
    prisma.like.findUnique({ where: { userId_mediaId: { userId, mediaId } } }),
    prisma.favorite.findUnique({ where: { userId_mediaId: { userId, mediaId } } }),
  ]);

  return { liked: Boolean(like), favorited: Boolean(favorite) };
}

export async function getPopularCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { media: true } },
    },
  });
}

const DETAIL_INCLUDE = {
  uploader: { select: { id: true, name: true, username: true, image: true } },
  variants: true,
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
  characters: { include: { character: true } },
  series: { include: { series: true } },
} satisfies Prisma.MediaInclude;

export type MediaDetail = Prisma.MediaGetPayload<{ include: typeof DETAIL_INCLUDE }>;

/**
 * Fetches a single media item. Everyone else only ever sees it once it's
 * PUBLISHED and NSFW-gated same as any list; the uploader can additionally
 * see their own item in any status (e.g. PROCESSING right after upload) so
 * the post-upload redirect doesn't 404 on itself. Soft-deleted items 404 for
 * everyone, including the owner.
 */
export async function getVisibleMediaById(id: string, viewer: ViewerContext): Promise<MediaDetail | null> {
  return prisma.media.findFirst({
    where: {
      id,
      deletedAt: null,
      OR: [
        { status: "PUBLISHED", ...(viewer.canSeeNsfw ? {} : { nsfw: false }) },
        ...(viewer.userId ? [{ uploaderId: viewer.userId }] : []),
      ],
    },
    include: DETAIL_INCLUDE,
  });
}
