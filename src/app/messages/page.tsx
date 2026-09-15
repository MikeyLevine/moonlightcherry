import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getConversationsForUser } from "@/lib/messaging/queries";
import { formatRelativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/messages");

  const conversations = await getConversationsForUser(session.user.id);

  return (
    <div className="mx-auto max-w-[720px] px-5 py-16 sm:px-8">
      <h1 className="text-4xl text-moonlight sm:text-5xl">Messages</h1>

      {conversations.length === 0 ? (
        <p className="mt-8 text-sm text-ash">
          No conversations yet. Visit someone&rsquo;s profile and hit &ldquo;Message&rdquo; to start one.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col divide-y divide-white/[0.09] border-y border-white/[0.09]">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/messages/${c.id}`}
                className={`flex items-center gap-3 px-2 py-3.5 transition-colors hover:bg-white/[0.03] ${
                  c.unread ? "bg-white/[0.03]" : ""
                }`}
              >
                {c.other?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.other.image} alt="" className="h-10 w-10 shrink-0 rounded-full" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-charcoal text-sm text-moonlight">
                    {(c.other?.name ?? "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-moonlight">{c.other?.name ?? c.other?.username ?? "a deleted user"}</p>
                  <p className="truncate text-xs text-ash">{c.lastMessage?.content ?? "No messages yet"}</p>
                </div>
                {c.lastMessage ? (
                  <span className="shrink-0 text-xs text-ash">{formatRelativeTime(c.lastMessage.createdAt)}</span>
                ) : null}
                {c.unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-cherry" aria-label="Unread" /> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
