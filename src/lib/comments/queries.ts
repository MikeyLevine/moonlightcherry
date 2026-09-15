import { prisma } from "@/lib/prisma";

const AUTHOR_SELECT = { id: true, name: true, username: true, image: true } as const;

export type CommentAuthor = { id: string; name: string | null; username: string | null; image: string | null } | null;

export type CommentView = {
  id: string;
  content: string;
  createdAt: Date;
  author: CommentAuthor;
  likeCount: number;
  liked: boolean;
};

export type CommentThread = CommentView & { replies: CommentView[] };

export async function getCommentsForMedia(mediaId: string, viewerId: string | null): Promise<CommentThread[]> {
  const topLevel = await prisma.comment.findMany({
    where: { mediaId, parentId: null, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: AUTHOR_SELECT },
      _count: { select: { likes: true } },
      replies: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: { author: { select: AUTHOR_SELECT }, _count: { select: { likes: true } } },
      },
    },
  });

  const allIds = topLevel.flatMap((c) => [c.id, ...c.replies.map((r) => r.id)]);
  const likedIds = viewerId
    ? new Set(
        (
          await prisma.commentLike.findMany({
            where: { userId: viewerId, commentId: { in: allIds } },
            select: { commentId: true },
          })
        ).map((l) => l.commentId)
      )
    : new Set<string>();

  return topLevel.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    author: c.author,
    likeCount: c._count.likes,
    liked: likedIds.has(c.id),
    replies: c.replies.map((r) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt,
      author: r.author,
      likeCount: r._count.likes,
      liked: likedIds.has(r.id),
    })),
  }));
}
