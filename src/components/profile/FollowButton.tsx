"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFollow } from "@/lib/users/actions";
import { Button } from "@/components/ui/Button";

export function FollowButton({
  targetUserId,
  isAuthenticated,
  initialFollowing,
}: {
  targetUserId: string;
  isAuthenticated: boolean;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      const result = await toggleFollow(targetUserId);
      if (result.ok) {
        setFollowing(result.following);
      } else {
        setFollowing(!next);
      }
    });
  }

  return (
    <Button variant={following ? "ghost" : "primary"} onClick={handleClick} disabled={isPending}>
      {following ? "Following" : "Follow"}
    </Button>
  );
}
