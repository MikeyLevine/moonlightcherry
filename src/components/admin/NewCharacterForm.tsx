"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertCharacter } from "@/lib/admin/taxonomy-actions";

const fieldClasses =
  "rounded-sm border border-white/15 bg-charcoal px-3 py-2 text-sm text-moonlight placeholder:text-ash focus:outline-none";

export function NewCharacterForm({ allSeries }: { allSeries: { id: string; name: string }[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [seriesId, setSeriesId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await upsertCharacter({ name, seriesId: seriesId || null, avatarUrl: "", description: "" });
      if (!result.ok) return setError(result.error);
      setName("");
      setSeriesId("");
      router.refresh();
    });
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New character name"
        className={`${fieldClasses} max-w-xs flex-1`}
      />
      <select value={seriesId} onChange={(e) => setSeriesId(e.target.value)} className={fieldClasses}>
        <option value="">No series</option>
        {allSeries.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
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
