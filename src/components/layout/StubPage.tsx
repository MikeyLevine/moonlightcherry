import Link from "next/link";

type StubPageProps = {
  title: string;
  description: string;
  links?: { href: string; label: string }[];
};

/**
 * Placeholder for a route that exists and is reachable, but whose real
 * content hasn't been built yet — used only for routes scheduled in a
 * later development phase. Never used for a feature that already works.
 */
export function StubPage({ title, description, links }: StubPageProps) {
  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-5 py-20 sm:px-8 sm:py-28">
      <h1 className="text-4xl text-moonlight sm:text-5xl">{title}</h1>
      <p className="max-w-[60ch] text-base leading-relaxed text-ash">{description}</p>
      {links && links.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-sm text-moonlight underline underline-offset-4">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
