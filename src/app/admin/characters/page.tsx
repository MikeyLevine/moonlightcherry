import type { Metadata } from "next";
import { listCharacters, listSeries } from "@/lib/taxonomy/queries";
import { AdminCharacterActions } from "@/components/admin/AdminCharacterActions";
import { NewCharacterForm } from "@/components/admin/NewCharacterForm";

export const metadata: Metadata = { title: "Characters" };

export default async function AdminCharactersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [characters, allSeries] = await Promise.all([
    listCharacters({ q: q?.trim() || null, take: 200 }),
    listSeries({ take: 500 }),
  ]);
  const allSeriesOptions = allSeries.map((s) => ({ id: s.id, name: s.name }));

  return (
    <div>
      <h1 className="text-3xl text-moonlight">Characters</h1>
      <form action="/admin/characters" method="get" className="mt-4 max-w-sm">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search characters"
          className="w-full rounded-sm border border-white/15 bg-charcoal px-3 py-2 text-sm text-moonlight placeholder:text-ash focus:outline-none"
        />
      </form>

      <NewCharacterForm allSeries={allSeriesOptions} />

      <ul className="mt-6 flex flex-col divide-y divide-white/[0.09] border-y border-white/[0.09]">
        {characters.map((character) => (
          <li key={character.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm text-moonlight">{character.name}</p>
              <p className="text-xs text-ash">
                {character.series?.name ?? "No series"} · {character._count.media} uploads
              </p>
            </div>
            <AdminCharacterActions
              character={{
                id: character.id,
                name: character.name,
                seriesId: character.seriesId,
                avatarUrl: character.avatarUrl,
                description: character.description,
              }}
              allSeries={allSeriesOptions}
              otherCharacters={characters.filter((c) => c.id !== character.id).map((c) => ({ id: c.id, name: c.name }))}
            />
          </li>
        ))}
        {characters.length === 0 ? <li className="py-4 text-sm text-ash">No characters found.</li> : null}
      </ul>
    </div>
  );
}
