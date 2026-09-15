"use client";

import { useEffect } from "react";
import { markAllNotificationsRead } from "@/lib/notifications/actions";

/**
 * Fires only once the page has actually mounted client-side — never on
 * Next's Link-hover/viewport prefetch of the Server Component, which would
 * otherwise mark everything read before the viewer ever saw it.
 */
export function MarkAllReadOnMount() {
  useEffect(() => {
    markAllNotificationsRead();
  }, []);

  return null;
}
