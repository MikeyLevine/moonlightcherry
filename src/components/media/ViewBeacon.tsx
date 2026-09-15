"use client";

import { useEffect } from "react";

export function ViewBeacon({ mediaId }: { mediaId: string }) {
  useEffect(() => {
    fetch(`/api/media/${mediaId}/view`, { method: "POST" }).catch(() => {});
  }, [mediaId]);

  return null;
}
