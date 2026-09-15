"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ url, title });
        return;
      } catch {
        // User cancelled the share sheet, or the platform doesn't actually
        // support it despite the function existing — fall through to copy.
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="ghost" onClick={handleShare}>
      {copied ? "Copied!" : "Share"}
    </Button>
  );
}
