import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { getConversationWithOther, getConversationMessages, isBlockedEitherWay, isBlockingUser } from "@/lib/messaging/queries";
import { ConversationView } from "@/components/messaging/ConversationView";
import { MarkConversationReadOnMount } from "@/components/messaging/MarkConversationReadOnMount";
import { BlockButton } from "@/components/messaging/BlockButton";
import { ReportButton } from "@/components/moderation/ReportButton";

export const metadata: Metadata = { title: "Conversation" };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/messages/${id}`);

  const result = await getConversationWithOther(id, session.user.id);
  if (!result) notFound();

  const messages = await getConversationMessages(id, session.user.id);
  if (!messages) notFound();

  const { other } = result;
  const [blockedEitherWay, isBlockingThem] = await Promise.all([
    other ? isBlockedEitherWay(session.user.id, other.id) : Promise.resolve(false),
    other ? isBlockingUser(session.user.id, other.id) : Promise.resolve(false),
  ]);

  return (
    <div className="mx-auto max-w-[720px] px-5 py-10 sm:px-8">
      <MarkConversationReadOnMount conversationId={id} />

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {other?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={other.image} alt="" className="h-9 w-9 rounded-full" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-charcoal text-sm text-moonlight">
              {(other?.name ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          {other?.username ? (
            <Link href={`/u/${other.username}`} className="font-display text-lg text-moonlight hover:underline">
              {other.name ?? other.username}
            </Link>
          ) : (
            <span className="font-display text-lg text-moonlight">a deleted user</span>
          )}
        </div>
        {other ? (
          <div className="flex items-center gap-4">
            <BlockButton targetUserId={other.id} initiallyBlocked={isBlockingThem} />
            <ReportButton targetType="USER" targetId={other.id} isAuthenticated />
          </div>
        ) : null}
      </div>

      <ConversationView
        conversationId={id}
        viewerId={session.user.id}
        initialMessages={messages}
        canSend={!blockedEitherWay}
      />
    </div>
  );
}
