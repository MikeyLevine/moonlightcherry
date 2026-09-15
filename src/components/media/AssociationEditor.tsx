"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SeriesType } from "@prisma/client";
import { updateMediaAssociations } from "@/lib/taxonomy/actions";
import { Button } from "@/components/ui/Button";

type Category = { id: string; name: string };

const SERIES_TYPES: SeriesType[] = ["ANIME", "MANGA", "OTHER"];

export function AssociationEditor({
  mediaId,
  categories,
  initialCategoryIds,
  initialTags,
  initialCharacter,
  initialSeries,
  initialSeriesType,
}: {
  mediaId: string;
  categories: Category[];
  initialCategoryIds: string[];
  initialTags: string;
  initialCharacter: string;
  initialSeries: string;
  initialSeriesType: SeriesType;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState(initialTags);
  const [character, setCharacter] = useState(initialCharacter);
  const [series, setSeries] = useState(initialSeries);
  const [seriesType, setSeriesType] = useState<SeriesType>(initialSeriesType);
  const [categoryIds, setCategoryIds] = useState<string[]>(initialCategoryIds);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    setError(null);
    startTransition(async () => {
      const result = await updateMediaAssociations(mediaId, {
        tagNames: tags.split(",").map((t) => t.trim()),
        characterName: character.trim() || null,
        seriesName: series.trim() || null,
        seriesType,
        categoryIds,
      });
      if (result.ok) {
        setStatus("saved");
        router.refresh();
      } else {
        setStatus("error");
        setError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm text-moonlight underline underline-offset-4">
        Edit tags & metadata
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4 rounded-md border border-white/10 bg-charcoal p-5">
      <div>
        <label htmlFor="tags" className="mb-1.5 block text-sm font-bold text-moonlight">
          Tags
        </label>
        <input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="comma, separated, tags"
          className="w-full rounded-sm border border-white/15 bg-void px-3 py-2 text-sm text-moonlight placeholder:text-ash focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="character" className="mb-1.5 block text-sm font-bold text-moonlight">
            Character
          </label>
          <input
            id="character"
            value={character}
            onChange={(e) => setCharacter(e.target.value)}
            placeholder="Character name"
            className="w-full rounded-sm border border-white/15 bg-void px-3 py-2 text-sm text-moonlight placeholder:text-ash focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="series" className="mb-1.5 block text-sm font-bold text-moonlight">
            Anime / manga series
          </label>
          <div className="flex gap-2">
            <input
              id="series"
              value={series}
              onChange={(e) => setSeries(e.target.value)}
              placeholder="Series name"
              className="w-full rounded-sm border border-white/15 bg-void px-3 py-2 text-sm text-moonlight placeholder:text-ash focus:outline-none"
            />
            <select
              value={seriesType}
              onChange={(e) => setSeriesType(e.target.value as SeriesType)}
              className="rounded-sm border border-white/15 bg-void px-2 py-2 text-sm text-moonlight focus:outline-none"
            >
              {SERIES_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-bold text-moonlight">Categories</span>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-1.5 text-sm text-ash">
              <input
                type="checkbox"
                checked={categoryIds.includes(cat.id)}
                onChange={() => toggleCategory(cat.id)}
                className="accent-cherry"
              />
              {cat.name}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="text" onClick={() => setOpen(false)}>
          Close
        </Button>
        {status === "saved" ? <span className="text-sm text-ash">Saved.</span> : null}
        {status === "error" ? <span className="text-sm text-ember">{error}</span> : null}
      </div>
    </form>
  );
}
