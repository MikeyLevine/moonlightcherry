"use client";

import { useEffect } from "react";
import { markConversationRead } from "@/lib/messaging/actions";

export function MarkConversationReadOnMount({ conversationId }: { conversationId: string }) {
  useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId]);

  return null;
}
