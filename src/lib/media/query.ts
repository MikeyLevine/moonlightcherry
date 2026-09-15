import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ViewerContext = {
  userId: string | null;
  canSeeNsfw: boolean;
};

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
  };
}

/** The shared visibility filter: published, not soft-deleted, and NSFW-gated. */
export function visibleMediaWhere(viewer: ViewerContext): Prisma.MediaWhereInput {
  return {
    status: "PUBLISHED",
    deletedAt: null,
    ...(viewer.canSeeNsfw ? {} : { nsfw: false }),
  };
}

const CARD_SELECT = {
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
};

export async function getMediaPage(
  sort: MediaSort,
  options: ListOptions
): Promise<{ items: MediaCard[]; nextCursor: string | null }> {
  const { viewer, take = 24, cursor = null, categorySlug = null } = options;

  const where: Prisma.MediaWhereInput = {
    ...visibleMediaWhere(viewer),
    ...(categorySlug ? { categories: { some: { category: { slug: categorySlug } } } } : {}),
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

export async function getRandomMediaId(viewer: ViewerContext): Promise<string | null> {
  const where = visibleMediaWhere(viewer);
  const count = await prisma.media.count({ where });
  if (count === 0) return null;

  const skip = Math.floor(Math.random() * count);
  const [row] = await prisma.media.findMany({ where, select: { id: true }, take: 1, skip });
  return row?.id ?? null;
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
