"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MediaStatus } from "@prisma/client";
import { moderateMedia } from "@/lib/admin/actions";

export function AdminMediaActions({
  mediaId,
  status,
  featured,
}: {
  mediaId: string;
  status: MediaStatus;
  featured: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handle(action: "REMOVE" | "RESTORE" | "DELETE" | "TOGGLE_FEATURED") {
    if (action === "DELETE" && !confirm("Permanently delete this upload? This can't be undone.")) return;
    startTransition(async () => {
      await moderateMedia(mediaId, action);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {status === "PUBLISHED" ? (
        <button type="button" onClick={() => handle("REMOVE")} disabled={isPending} className="text-ember underline underline-offset-4">
          Remove
        </button>
      ) : status === "REMOVED" ? (
        <button type="button" onClick={() => handle("RESTORE")} disabled={isPending} className="text-moonlight underline underline-offset-4">
          Restore
        </button>
      ) : null}
      <button type="button" onClick={() => handle("TOGGLE_FEATURED")} disabled={isPending} className="text-moonlight underline underline-offset-4">
        {featured ? "Unfeature" : "Feature"}
      </button>
      <button type="button" onClick={() => handle("DELETE")} disabled={isPending} className="text-ash underline underline-offset-4">
        Delete
      </button>
    </div>
  );
}
