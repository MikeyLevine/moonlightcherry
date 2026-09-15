import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewerContext } from "@/lib/media/query";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const viewer = await getViewerContext();
  if (!viewer.userId) redirect("/login?callbackUrl=/dashboard");

  const [uploadCount, favoriteCount, collectionCount] = await Promise.all([
    prisma.media.count({ where: { uploaderId: viewer.userId, deletedAt: null } }),
    prisma.favorite.count({ where: { userId: viewer.userId } }),
    prisma.collection.count({ where: { ownerId: viewer.userId, deletedAt: null } }),
  ]);

  const sections = [
    { href: "/dashboard/uploads", label: "Uploads", count: uploadCount },
    { href: "/dashboard/favorites", label: "Favorites", count: favoriteCount },
    { href: "/dashboard/collections", label: "Collections", count: collectionCount },
  ];

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
      <h1 className="text-4xl text-moonlight sm:text-5xl">Dashboard</h1>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-md border border-white/[0.09] bg-charcoal p-6 transition-colors hover:border-white/20"
          >
            <p className="font-display text-3xl tabular-nums text-moonlight">{s.count}</p>
            <p className="mt-1 text-sm text-ash">{s.label}</p>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-xs text-ash">Upload history isn&rsquo;t built yet.</p>
    </div>
  );
}
