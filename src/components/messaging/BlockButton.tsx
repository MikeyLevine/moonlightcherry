"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleBlock } from "@/lib/messaging/actions";

export function BlockButton({ targetUserId, initiallyBlocked }: { targetUserId: string; initiallyBlocked: boolean }) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const next = !blocked;
    setBlocked(next);
    startTransition(async () => {
      const result = await toggleBlock(targetUserId);
      if (result.ok) {
        setBlocked(result.blocked);
        router.refresh();
      } else {
        setBlocked(!next);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-sm text-ash underline underline-offset-4 hover:text-ember"
    >
      {blocked ? "Unblock" : "Block"}
    </button>
  );
}
