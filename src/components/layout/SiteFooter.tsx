import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { href: "/gallery", label: "Gallery" },
      { href: "/tags", label: "Tags" },
      { href: "/characters", label: "Characters" },
      { href: "/anime", label: "Anime & manga" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/upload", label: "Upload" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/messages", label: "Messages" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.09] py-11">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo id="footer" />
          <p className="mt-3 max-w-[32ch] text-sm leading-relaxed text-ash">
            A gallery for anime art, built for artists and the people who stay up scrolling past midnight.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3.5 text-sm font-bold text-moonlight">{col.title}</h4>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ash transition-colors hover:text-moonlight">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-9 max-w-[1280px] border-t border-white/[0.09] px-5 pt-5 text-xs text-ash sm:px-8">
        <span>&copy; Moonlight Cherry</span>
      </div>
    </footer>
  );
}
