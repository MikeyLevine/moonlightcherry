"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SeriesType } from "@prisma/client";
import { updateMediaAssociations } from "@/lib/taxonomy/actions";
import { Button } from "@/components/ui/Button";
import { MetadataFields, type Category } from "@/components/media/MetadataFields";

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
      <MetadataFields
        tags={tags}
        onTagsChange={setTags}
        character={character}
        onCharacterChange={setCharacter}
        series={series}
        onSeriesChange={setSeries}
        seriesType={seriesType}
        onSeriesTypeChange={setSeriesType}
        categories={categories}
        categoryIds={categoryIds}
        onToggleCategory={toggleCategory}
      />

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
