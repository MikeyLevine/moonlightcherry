"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const POLL_MS = 30_000;

export function NotificationBell() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchCount() {
      try {
        const res = await fetch("/api/notifications/unread-count");
        const data = await res.json();
        if (!cancelled) setCount(data.count ?? 0);
      } catch {
        // Silent — a missed poll just means the badge is stale until the next one.
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // Re-poll immediately on navigation (e.g. right after visiting /notifications).
  }, [pathname]);

  return (
    <Link href="/notifications" aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`} className="relative">
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-ash hover:text-moonlight" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cherry px-1 text-[10px] font-bold tabular-nums text-on-cherry">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
