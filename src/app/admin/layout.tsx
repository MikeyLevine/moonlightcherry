import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { isModerator } from "@/lib/admin/permissions";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (!isModerator(session.user.role)) redirect("/");

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8">
      <div className="mb-8 flex items-center gap-6 border-b border-white/[0.09] pb-4">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="text-sm text-ash hover:text-moonlight">
            {item.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
