"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SeriesType } from "@prisma/client";
import { upsertSeries, mergeSeries, deleteSeries } from "@/lib/admin/taxonomy-actions";

const fieldClasses =
  "w-full rounded-sm border border-white/15 bg-charcoal px-2 py-1.5 text-xs text-moonlight placeholder:text-ash focus:outline-none";
const SERIES_TYPES: SeriesType[] = ["ANIME", "MANGA", "OTHER"];

type Series = { id: string; name: string; type: SeriesType; coverUrl: string | null; description: string | null };

export function AdminSeriesActions({
  series,
  otherSeries,
}: {
  series: Series;
  otherSeries: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(series.name);
  const [type, setType] = useState<SeriesType>(series.type);
  const [coverUrl, setCoverUrl] = useState(series.coverUrl ?? "");
  const [description, setDescription] = useState(series.description ?? "");
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await upsertSeries({ id: series.id, name, type, coverUrl, description });
      if (!result.ok) return setError(result.error);
      setOpen(false);
      router.refresh();
    });
  }

  function handleMerge() {
    if (!mergeTargetId) return;
    if (!confirm(`Merge "${series.name}" into the selected series? This can't be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await mergeSeries(series.id, mergeTargetId);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${series.name}"? This removes it from every upload and unlinks its characters.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteSeries(series.id);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-moonlight underline underline-offset-4">
        Manage
      </button>
    );
  }

  return (
    <div className="flex w-72 flex-col gap-2 rounded-md border border-white/10 bg-void p-3">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={fieldClasses} />
      <select value={type} onChange={(e) => setType(e.target.value as SeriesType)} className={fieldClasses}>
        {SERIES_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <input
        value={coverUrl}
        onChange={(e) => setCoverUrl(e.target.value)}
        placeholder="Cover URL (optional)"
        className={fieldClasses}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className={fieldClasses}
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="rounded-sm bg-cherry px-3 py-1.5 text-xs font-bold text-on-cherry disabled:opacity-50"
      >
        Save
      </button>

      <div className="flex gap-2 border-t border-white/10 pt-2">
        <select value={mergeTargetId} onChange={(e) => setMergeTargetId(e.target.value)} className={`${fieldClasses} flex-1`}>
          <option value="">Merge into…</option>
          {otherSeries.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleMerge}
          disabled={isPending || !mergeTargetId}
          className="shrink-0 rounded-sm border border-white/15 px-2 py-1.5 text-xs text-moonlight disabled:opacity-40"
        >
          Merge
        </button>
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={handleDelete} disabled={isPending} className="text-xs text-ember underline underline-offset-4">
          Delete
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-ash">
          Close
        </button>
      </div>
      {error ? <p className="text-xs text-ember">{error}</p> : null}
    </div>
  );
}
