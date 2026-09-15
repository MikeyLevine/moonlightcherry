"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { doSignOut } from "@/lib/actions";

const NAV_LINKS = [
  { href: "/gallery", label: "Gallery" },
  { href: "/tags", label: "Tags" },
  { href: "/characters", label: "Characters" },
  { href: "/anime", label: "Anime" },
];

type SiteHeaderUser = {
  name?: string | null;
  image?: string | null;
  username?: string | null;
} | null;

export function SiteHeader({ user = null }: { user?: SiteHeaderUser }) {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky z-20 border-b border-white/[0.09] bg-void/80 backdrop-blur-md"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <Link href="/" aria-label="Moonlight Cherry home">
          <Logo id="nav" />
        </Link>

        <nav className="hidden gap-7 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-ash transition-colors hover:text-moonlight"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href={user.username ? `/u/${user.username}` : "/settings"}
                className="hidden items-center gap-2 sm:flex"
              >
                {user.image ? (
                  <Image src={user.image} alt="" width={28} height={28} className="rounded-full" />
                ) : null}
                <span className="text-sm text-ash hover:text-moonlight">{user.name}</span>
              </Link>
              <form action={doSignOut}>
                <Button variant="text" type="submit">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button variant="text" href="/login" className="hidden sm:inline-flex">
                Sign in
              </Button>
              <Button variant="primary" href="/login">
                Join free
              </Button>
            </>
          )}
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-white/15 text-moonlight sm:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <line x1="1" y1="4" x2="15" y2="4" />
              <line x1="1" y1="8" x2="15" y2="8" />
              <line x1="1" y1="12" x2="15" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <nav id="mobile-nav" className="flex flex-col gap-1 border-t border-white/[0.09] px-5 pb-4 sm:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="py-2.5 text-sm text-ash"
            >
              {link.label}
            </Link>
          ))}
          {!user ? (
            <Link href="/login" onClick={() => setOpen(false)} className="py-2.5 text-sm text-ash">
              Sign in
            </Link>
          ) : null}
        </nav>
      ) : null}
    </header>
  );
}
