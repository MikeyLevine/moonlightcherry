"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { startConversation } from "@/lib/messaging/actions";
import { Button } from "@/components/ui/Button";

export function MessageButton({ targetUserId, isAuthenticated }: { targetUserId: string; isAuthenticated: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    startTransition(async () => {
      const result = await startConversation(targetUserId);
      if (result.ok) {
        router.push(`/messages/${result.id}`);
      }
    });
  }

  return (
    <Button variant="ghost" onClick={handleClick} disabled={isPending}>
      Message
    </Button>
  );
}
