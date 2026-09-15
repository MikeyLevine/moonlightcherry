import Link from "next/link";
import { SearchField } from "@/components/ui/SearchField";

export default function HomePage() {
  return (
    <section className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 sm:py-24">
      <div className="max-w-[46ch]">
        <h1 className="text-4xl leading-[1.05] text-moonlight sm:text-5xl">
          Anime art, <em className="text-ember">after dark.</em>
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ash">
          Fan art, official art, and wallpapers from a community that never logs off. Browse
          without an account, or sign in to save what you love.
        </p>
        <div className="mt-7">
          <SearchField id="home-search" placeholder="Search characters, series, or tags" />
        </div>
      </div>

      <div className="mt-16 rounded-md border border-white/10 bg-charcoal px-6 py-8">
        <p className="max-w-[62ch] text-sm leading-relaxed text-ash">
          The full discovery feed — trending uploads, recent activity, featured characters and
          tags — lands once the media pipeline is built. For now, the section pages below are
          real, reachable routes:
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {[
            { href: "/gallery", label: "Gallery" },
            { href: "/tags", label: "Tags" },
            { href: "/characters", label: "Characters" },
            { href: "/anime", label: "Anime" },
          ].map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-sm text-moonlight underline underline-offset-4">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
