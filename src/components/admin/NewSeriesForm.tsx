"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SeriesType } from "@prisma/client";
import { upsertSeries } from "@/lib/admin/taxonomy-actions";

const fieldClasses =
  "rounded-sm border border-white/15 bg-charcoal px-3 py-2 text-sm text-moonlight placeholder:text-ash focus:outline-none";
const SERIES_TYPES: SeriesType[] = ["ANIME", "MANGA", "OTHER"];

export function NewSeriesForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<SeriesType>("ANIME");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await upsertSeries({ name, type, coverUrl: "", description: "" });
      if (!result.ok) return setError(result.error);
      setName("");
      router.refresh();
    });
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New series name"
        className={`${fieldClasses} max-w-xs flex-1`}
      />
      <select value={type} onChange={(e) => setType(e.target.value as SeriesType)} className={fieldClasses}>
        {SERIES_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleCreate}
        disabled={isPending || !name.trim()}
        className="rounded-sm bg-cherry px-4 py-2 text-sm font-bold text-on-cherry disabled:opacity-50"
      >
        Create
      </button>
      {error ? <p className="w-full text-xs text-ember">{error}</p> : null}
    </div>
  );
}
