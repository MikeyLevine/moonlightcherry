"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MediaGrid } from "./MediaGrid";
import type { MediaCard, MediaSort } from "@/lib/media/query";

type Props = {
  initialItems: MediaCard[];
  initialCursor: string | null;
  sort: MediaSort;
  categorySlug: string | null;
};

// The parent keys this component by `${sort}-${categorySlug}`, so a filter
// change remounts it fresh — no need to sync props back into state here.
export function InfiniteMediaGrid({ initialItems, initialCursor, sort, categorySlug }: Props) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !cursor) return;
    setLoading(true);
    const params = new URLSearchParams({ sort, cursor });
    if (categorySlug) params.set("category", categorySlug);

    const res = await fetch(`/api/media?${params.toString()}`);
    const data = await res.json();
    setItems((prev) => [...prev, ...data.items]);
    setCursor(data.nextCursor);
    setLoading(false);
  }, [loading, cursor, sort, categorySlug]);

  useEffect(() => {
    if (!cursor) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "800px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  return (
    <div>
      <MediaGrid items={items} />
      {cursor ? (
        <div ref={sentinelRef} className="py-8 text-center text-sm text-ash" aria-live="polite">
          {loading ? "Loading more…" : ""}
        </div>
      ) : null}
    </div>
  );
}
