import type { Metadata } from "next";
import Link from "next/link";
import { searchUsersAdmin } from "@/lib/admin/queries";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { formatRelativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const users = await searchUsersAdmin(q?.trim() || null);

  return (
    <div>
      <h1 className="text-3xl text-moonlight">Users</h1>
      <form action="/admin/users" method="get" className="mt-4 max-w-sm">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name, username, or email"
          className="w-full rounded-sm border border-white/15 bg-charcoal px-3 py-2 text-sm text-moonlight placeholder:text-ash focus:outline-none"
        />
      </form>

      <ul className="mt-6 flex flex-col divide-y divide-white/[0.09] border-y border-white/[0.09]">
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
            {u.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={u.image} alt="" className="h-9 w-9 rounded-full" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-charcoal text-xs text-moonlight">
                {(u.name ?? "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {u.username ? (
                <Link href={`/u/${u.username}`} className="text-sm text-moonlight hover:underline">
                  {u.name ?? u.username}
                </Link>
              ) : (
                <span className="text-sm text-moonlight">{u.name ?? "Unnamed"}</span>
              )}
              <p className="text-xs text-ash">
                {u.role} · {u.moderationStatus} · {u._count.media} uploads · joined {formatRelativeTime(u.createdAt)}
              </p>
            </div>
            <AdminUserActions userId={u.id} currentRole={u.role} currentStatus={u.moderationStatus} />
          </li>
        ))}
        {users.length === 0 ? <li className="py-4 text-sm text-ash">No users found.</li> : null}
      </ul>
    </div>
  );
}
