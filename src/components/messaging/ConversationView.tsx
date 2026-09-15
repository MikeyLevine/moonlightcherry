"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { sendMessage } from "@/lib/messaging/actions";
import { formatRelativeTime } from "@/lib/format";
import type { MessageView } from "@/lib/messaging/queries";

const POLL_MS = 4000;

export function ConversationView({
  conversationId,
  viewerId,
  initialMessages,
  canSend,
}: {
  conversationId: string;
  viewerId: string;
  initialMessages: MessageView[];
  canSend: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/messages/${conversationId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);
        }
      } catch {
        // Silent — a missed poll just means the view is stale until the next one.
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [conversationId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    const result = await sendMessage(conversationId, draft);
    if (result.ok) {
      setMessages((prev) => [...prev, result.message]);
      setDraft("");
    }
    setSending(false);
  }

  return (
    <div className="flex h-[65vh] flex-col">
      <div className="flex-1 overflow-y-auto rounded-md border border-white/[0.09] bg-charcoal p-4">
        <div className="flex flex-col gap-3">
          {messages.length === 0 ? <p className="text-sm text-ash">No messages yet — say hi.</p> : null}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.senderId === viewerId ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-md px-3 py-2 text-sm ${
                  m.senderId === viewerId ? "bg-cherry text-on-cherry" : "bg-charcoal-2 text-moonlight"
                }`}
              >
                <p className="break-words">{m.content}</p>
                <p className={`mt-1 text-[10px] ${m.senderId === viewerId ? "text-on-cherry/70" : "text-ash"}`}>
                  {formatRelativeTime(new Date(m.createdAt))}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {canSend ? (
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message…"
            className="flex-1 rounded-sm border border-white/15 bg-charcoal px-3 py-2.5 text-sm text-moonlight placeholder:text-ash focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="rounded-sm bg-cherry px-4 py-2 text-sm font-bold text-on-cherry disabled:opacity-50"
          >
            Send
          </button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-ash">You can&rsquo;t send messages in this conversation.</p>
      )}
    </div>
  );
}
