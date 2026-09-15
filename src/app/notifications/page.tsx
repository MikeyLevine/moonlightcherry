import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getNotifications } from "@/lib/notifications/queries";
import { notificationText } from "@/lib/notifications/format";
import { formatRelativeTime } from "@/lib/format";
import { MarkAllReadOnMount } from "@/components/notifications/MarkAllReadOnMount";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/notifications");

  const notifications = await getNotifications(session.user.id);

  return (
    <div className="mx-auto max-w-[720px] px-5 py-16 sm:px-8">
      <MarkAllReadOnMount />
      <h1 className="text-4xl text-moonlight sm:text-5xl">Notifications</h1>

      {notifications.length === 0 ? (
        <p className="mt-8 text-sm text-ash">Nothing yet.</p>
      ) : (
        <ul className="mt-8 flex flex-col divide-y divide-white/[0.09] border-y border-white/[0.09]">
          {notifications.map((n) => {
            const actorLabel = n.actor?.name ?? n.actor?.username ?? "Someone";
            return (
              <li key={n.id}>
                <Link
                  href={n.href}
                  className={`flex items-center gap-3 px-2 py-3.5 transition-colors hover:bg-white/[0.03] ${
                    !n.read ? "bg-white/[0.03]" : ""
                  }`}
                >
                  {n.actor?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={n.actor.image} alt="" className="h-9 w-9 shrink-0 rounded-full" />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-charcoal text-sm text-moonlight">
                      {actorLabel.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-moonlight">{notificationText(n.type, actorLabel)}</p>
                    <p className="mt-0.5 text-xs text-ash">{formatRelativeTime(n.createdAt)}</p>
                  </div>
                  {n.media?.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={n.media.thumbnailUrl} alt="" className="h-11 w-11 shrink-0 rounded-sm object-cover" />
                  ) : null}
                  {!n.read ? <span className="h-2 w-2 shrink-0 rounded-full bg-cherry" aria-label="Unread" /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
