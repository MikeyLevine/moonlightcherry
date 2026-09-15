import { prisma } from "@/lib/prisma";
import { visibleMediaWhere, CARD_SELECT, type ViewerContext } from "@/lib/media/query";

export async function getCollectionById(id: string, viewer: ViewerContext) {
  const collection = await prisma.collection.findUnique({
    where: { id, deletedAt: null },
    include: {
      owner: { select: { id: true, name: true, username: true, image: true } },
      _count: { select: { items: true } },
    },
  });

  if (!collection) return null;
  if (collection.visibility === "PRIVATE" && collection.ownerId !== viewer.userId) return null;

  // Collection visibility and per-item NSFW visibility are separate checks —
  // a public collection can still contain NSFW items that stay hidden from
  // an ineligible viewer, same as anywhere else.
  const items = await prisma.collectionMedia.findMany({
    where: { collectionId: id, media: visibleMediaWhere(viewer) },
    orderBy: { addedAt: "desc" },
    select: { addedAt: true, media: { select: CARD_SELECT } },
  });

  return { collection, items: items.map((i) => i.media) };
}

export async function getUserCollections(ownerId: string, viewer: ViewerContext) {
  const isOwnProfile = viewer.userId === ownerId;
  return prisma.collection.findMany({
    where: {
      ownerId,
      deletedAt: null,
      ...(isOwnProfile ? {} : { visibility: "PUBLIC" }),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { items: true } },
      items: { orderBy: { addedAt: "desc" }, take: 1, select: { media: { select: { variants: true } } } },
    },
  });
}

/** Collections owned by the viewer, and whether each already contains this
 * media — used to render the "save to collection" checklist. */
export async function getViewerCollectionsWithMembership(viewerId: string, mediaId: string) {
  const collections = await prisma.collection.findMany({
    where: { ownerId: viewerId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, items: { where: { mediaId }, select: { mediaId: true } } },
  });

  return collections.map((c) => ({ id: c.id, name: c.name, inCollection: c.items.length > 0 }));
}
