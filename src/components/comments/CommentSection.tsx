"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { postComment, deleteComment, toggleCommentLike } from "@/lib/comments/actions";
import { formatCount, formatRelativeTime } from "@/lib/format";
import type { CommentThread, CommentView } from "@/lib/comments/queries";

const MENTION_SPLIT = /(@[a-z0-9-]{3,30})/gi;
const MENTION_MATCH = /^@[a-z0-9-]{3,30}$/i;

function MentionText({ content }: { content: string }): ReactNode {
  return content.split(MENTION_SPLIT).map((part, i) =>
    MENTION_MATCH.test(part) ? (
      <Link key={i} href={`/u/${part.slice(1)}`} className="text-ember hover:underline">
        {part}
      </Link>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function CommentRow({
  comment,
  viewerId,
  onReply,
  onDelete,
  requireAuth,
}: {
  comment: CommentView;
  viewerId: string | null;
  onReply?: () => void;
  onDelete: (id: string) => void;
  requireAuth: () => boolean;
}) {
  const [liked, setLiked] = useState(comment.liked);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [isPending, startTransition] = useTransition();

  function handleLike() {
    if (!requireAuth()) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const result = await toggleCommentLike(comment.id);
      if (result.ok) {
        setLiked(result.active);
        setLikeCount(result.count);
      } else {
        setLiked(!next);
        setLikeCount((c) => c - (next ? 1 : -1));
      }
    });
  }

  return (
    <div className="flex gap-3">
      {comment.author?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={comment.author.image} alt="" className="h-8 w-8 shrink-0 rounded-full" />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-charcoal text-xs text-moonlight">
          {(comment.author?.name ?? "?").charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          {comment.author?.username ? (
            <Link href={`/u/${comment.author.username}`} className="text-sm font-bold text-moonlight hover:underline">
              {comment.author.name ?? comment.author.username}
            </Link>
          ) : (
            <span className="text-sm font-bold text-moonlight">a deleted user</span>
          )}
          <span className="text-xs text-ash">{formatRelativeTime(comment.createdAt)}</span>
        </div>
        <p className="mt-0.5 text-sm break-words text-moonlight">
          <MentionText content={comment.content} />
        </p>
        <div className="mt-1 flex items-center gap-4">
          <button
            type="button"
            onClick={handleLike}
            disabled={isPending}
            className={`text-xs ${liked ? "text-cherry" : "text-ash"} hover:text-moonlight`}
          >
            {formatCount(likeCount)} {likeCount === 1 ? "like" : "likes"}
          </button>
          {onReply ? (
            <button type="button" onClick={onReply} className="text-xs text-ash hover:text-moonlight">
              Reply
            </button>
          ) : null}
          {viewerId && viewerId === comment.author?.id ? (
            <button type="button" onClick={() => onDelete(comment.id)} className="text-xs text-ash hover:text-ember">
              Delete
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function CommentSection({
  mediaId,
  isAuthenticated,
  viewerId,
  initialComments,
}: {
  mediaId: string;
  isAuthenticated: boolean;
  viewerId: string | null;
  initialComments: CommentThread[];
}) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isPending, startTransition] = useTransition();

  function requireAuth(): boolean {
    if (isAuthenticated) return true;
    router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
    return false;
  }

  function handlePost(e: FormEvent) {
    e.preventDefault();
    if (!requireAuth() || !newComment.trim()) return;
    startTransition(async () => {
      const result = await postComment(mediaId, newComment, null);
      if (result.ok) {
        setComments((prev) => [{ ...result.comment, replies: [] }, ...prev]);
        setNewComment("");
      }
    });
  }

  function handleReplySubmit(parentId: string, e: FormEvent) {
    e.preventDefault();
    if (!requireAuth() || !replyContent.trim()) return;
    startTransition(async () => {
      const result = await postComment(mediaId, replyContent, parentId);
      if (result.ok) {
        setComments((prev) =>
          prev.map((c) => (c.id === parentId ? { ...c, replies: [...c.replies, result.comment] } : c))
        );
        setReplyContent("");
        setReplyingTo(null);
      }
    });
  }

  function handleDelete(id: string) {
    setComments((prev) =>
      prev.filter((c) => c.id !== id).map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== id) }))
    );
    startTransition(async () => {
      await deleteComment(id);
    });
  }

  const totalCount = comments.reduce((n, c) => n + 1 + c.replies.length, 0);

  return (
    <div className="mt-10 border-t border-white/[0.09] pt-8">
      <h2 className="mb-5 text-xl text-moonlight">Comments ({totalCount})</h2>

      <form onSubmit={handlePost} className="mb-6 flex flex-col gap-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={2}
          placeholder={isAuthenticated ? "Add a comment…" : "Sign in to comment"}
          className="w-full rounded-sm border border-white/15 bg-charcoal px-3 py-2.5 text-sm text-moonlight placeholder:text-ash focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending || !newComment.trim()}
          className="self-start rounded-sm bg-cherry px-4 py-2 text-sm font-bold text-on-cherry disabled:opacity-50"
        >
          Post
        </button>
      </form>

      <div className="flex flex-col gap-6">
        {comments.map((comment) => (
          <div key={comment.id}>
            <CommentRow
              comment={comment}
              viewerId={viewerId}
              onReply={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              onDelete={handleDelete}
              requireAuth={requireAuth}
            />

            {replyingTo === comment.id ? (
              <form onSubmit={(e) => handleReplySubmit(comment.id, e)} className="ml-11 mt-2 flex flex-col gap-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={2}
                  placeholder={`Reply to ${comment.author?.name ?? "this comment"}…`}
                  className="w-full rounded-sm border border-white/15 bg-charcoal px-3 py-2 text-sm text-moonlight placeholder:text-ash focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isPending || !replyContent.trim()}
                    className="rounded-sm bg-cherry px-3 py-1.5 text-xs font-bold text-on-cherry disabled:opacity-50"
                  >
                    Reply
                  </button>
                  <button type="button" onClick={() => setReplyingTo(null)} className="text-xs text-ash">
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

            {comment.replies.length > 0 ? (
              <div className="ml-11 mt-3 flex flex-col gap-4">
                {comment.replies.map((reply) => (
                  <CommentRow key={reply.id} comment={reply} viewerId={viewerId} onDelete={handleDelete} requireAuth={requireAuth} />
                ))}
              </div>
            ) : null}
          </div>
        ))}

        {comments.length === 0 ? <p className="text-sm text-ash">No comments yet.</p> : null}
      </div>
    </div>
  );
}
