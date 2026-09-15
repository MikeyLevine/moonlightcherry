"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toggleLike, toggleFavorite } from "@/lib/media/actions";
import { formatCount } from "@/lib/format";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 2}>
      <path d="M12 21s-7-4.6-9.7-9C.6 8.7 2.2 5 5.6 5c2 0 3.4 1 4.4 2.6C11 6 12.4 5 14.4 5c3.4 0 5 3.7 3.3 7-2.7 4.4-9.7 9-9.7 9z" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 2}>
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
    </svg>
  );
}

function ToggleButton({
  active,
  count,
  icon,
  label,
  onToggle,
  disabled,
}: {
  active: boolean;
  count: number;
  icon: React.ReactNode;
  label: string;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={active}
      aria-label={label}
      className={`inline-flex items-center gap-2 rounded-sm border px-4 py-2 text-sm font-bold transition-colors disabled:opacity-60 ${
        active ? "border-cherry bg-cherry text-on-cherry" : "border-white/15 text-moonlight hover:border-moonlight"
      }`}
    >
      {icon}
      <span className="tabular-nums">{formatCount(count)}</span>
    </button>
  );
}

export function EngagementButtons({
  mediaId,
  isAuthenticated,
  isOwnUpload = false,
  initialLiked,
  initialLikeCount,
  initialFavorited,
  initialFavoriteCount,
}: {
  mediaId: string;
  isAuthenticated: boolean;
  isOwnUpload?: boolean;
  initialLiked: boolean;
  initialLikeCount: number;
  initialFavorited: boolean;
  initialFavoriteCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [favorited, setFavorited] = useState(initialFavorited);
  const [favoriteCount, setFavoriteCount] = useState(initialFavoriteCount);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function requireAuth(): boolean {
    if (isAuthenticated) return true;
    router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    return false;
  }

  function handleLike() {
    if (!requireAuth()) return;
    setError(null);
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const result = await toggleLike(mediaId);
      if (result.ok) {
        setLiked(result.active);
        setLikeCount(result.count);
      } else {
        setLiked(!next);
        setLikeCount((c) => c - (next ? 1 : -1));
        setError(result.error);
      }
    });
  }

  function handleFavorite() {
    if (!requireAuth()) return;
    const next = !favorited;
    setFavorited(next);
    setFavoriteCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const result = await toggleFavorite(mediaId);
      if (result.ok) {
        setFavorited(result.active);
        setFavoriteCount(result.count);
      } else {
        setFavorited(!next);
        setFavoriteCount((c) => c - (next ? 1 : -1));
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      {!isOwnUpload ? (
        <ToggleButton
          active={liked}
          count={likeCount}
          icon={<HeartIcon filled={liked} />}
          label={liked ? "Unlike" : "Like"}
          onToggle={handleLike}
          disabled={isPending}
        />
      ) : null}
      <ToggleButton
        active={favorited}
        count={favoriteCount}
        icon={<BookmarkIcon filled={favorited} />}
        label={favorited ? "Remove from favorites" : "Add to favorites"}
        onToggle={handleFavorite}
        disabled={isPending}
      />
      {error ? <span className="text-sm text-ember">{error}</span> : null}
    </div>
  );
}
