import type { Metadata } from "next";
import Link from "next/link";
import { listCharacters } from "@/lib/taxonomy/queries";

export const metadata: Metadata = { title: "Characters" };

export default async function CharactersPage() {
  const characters = await listCharacters({ take: 200 });

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
      <h1 className="text-4xl text-moonlight sm:text-5xl">Characters</h1>
      <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-ash">
        Browse art by character. Anyone can add a character while tagging their own upload.
      </p>

      {characters.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {characters.map((character) => (
            <Link key={character.id} href={`/characters/${character.slug}`} className="group text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-charcoal font-display text-2xl text-moonlight transition-colors group-hover:border-moonlight">
                {character.name.charAt(0).toUpperCase()}
              </div>
              <p className="mt-2.5 font-display text-sm text-moonlight">{character.name}</p>
              <p className="text-xs text-ash">
                {character.series ? character.series.name : "No series"} · {character._count.media}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-md border border-white/10 bg-charcoal px-6 py-10 text-center">
          <p className="text-sm text-ash">
            No characters yet — uploaders can add one from their media page.
          </p>
        </div>
      )}
    </div>
  );
}
