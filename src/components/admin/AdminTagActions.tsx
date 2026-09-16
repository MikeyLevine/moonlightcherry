"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renameTag, mergeTags, deleteTag } from "@/lib/admin/taxonomy-actions";

const fieldClasses = "rounded-sm border border-white/15 bg-charcoal px-2 py-1.5 text-xs text-moonlight focus:outline-none";

export function AdminTagActions({
  tagId,
  currentName,
  otherTags,
}: {
  tagId: string;
  currentName: string;
  otherTags: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRename() {
    setError(null);
    startTransition(async () => {
      const result = await renameTag(tagId, name);
      if (!result.ok) return setError(result.error);
      setOpen(false);
      router.refresh();
    });
  }

  function handleMerge() {
    if (!mergeTargetId) return;
    if (!confirm(`Merge "${currentName}" into the selected tag? This can't be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await mergeTags(tagId, mergeTargetId);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${currentName}"? This removes it from every upload.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteTag(tagId);
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
    <div className="flex w-64 flex-col gap-2 rounded-md border border-white/10 bg-void p-3">
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} className={`${fieldClasses} flex-1`} />
        <button
          type="button"
          onClick={handleRename}
          disabled={isPending || name.trim() === currentName}
          className="rounded-sm border border-white/15 px-2 py-1.5 text-xs text-moonlight disabled:opacity-40"
        >
          Rename
        </button>
      </div>

      <div className="flex gap-2">
        <select value={mergeTargetId} onChange={(e) => setMergeTargetId(e.target.value)} className={`${fieldClasses} flex-1`}>
          <option value="">Merge into…</option>
          {otherTags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleMerge}
          disabled={isPending || !mergeTargetId}
          className="rounded-sm border border-white/15 px-2 py-1.5 text-xs text-moonlight disabled:opacity-40"
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
