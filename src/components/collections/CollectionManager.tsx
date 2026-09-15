"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CollectionVisibility } from "@prisma/client";
import { createCollection, updateCollection, deleteCollection } from "@/lib/collections/actions";
import { CollectionForm } from "@/components/collections/CollectionForm";
import { Button } from "@/components/ui/Button";

export type CollectionSummary = {
  id: string;
  name: string;
  description: string | null;
  visibility: CollectionVisibility;
  itemCount: number;
  coverUrl: string | null;
};

export function CollectionManager({ initialCollections }: { initialCollections: CollectionSummary[] }) {
  const router = useRouter();
  const [collections, setCollections] = useState(initialCollections);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleCreate(values: { name: string; description: string; visibility: CollectionVisibility }) {
    const result = await createCollection(values);
    if (!result.ok) return { ok: false, error: result.error };

    setCollections((prev) => [
      { id: result.id, name: values.name, description: values.description || null, visibility: values.visibility, itemCount: 0, coverUrl: null },
      ...prev,
    ]);
    setCreating(false);
    return { ok: true };
  }

  async function handleUpdate(
    id: string,
    values: { name: string; description: string; visibility: CollectionVisibility }
  ) {
    const result = await updateCollection(id, values);
    if (!result.ok) return { ok: false, error: result.error };

    setCollections((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, name: values.name, description: values.description || null, visibility: values.visibility } : c
      )
    );
    setEditingId(null);
    return { ok: true };
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this collection? This can't be undone.")) return;
    setCollections((prev) => prev.filter((c) => c.id !== id));
    startTransition(async () => {
      await deleteCollection(id);
      router.refresh();
    });
  }

  return (
    <div className="mt-8 flex flex-col gap-4">
      {creating ? (
        <CollectionForm onSubmit={handleCreate} onCancel={() => setCreating(false)} />
      ) : (
        <Button variant="primary" onClick={() => setCreating(true)} className="self-start">
          New collection
        </Button>
      )}

      {collections.length === 0 ? (
        <p className="mt-4 text-sm text-ash">You haven&rsquo;t made any collections yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) =>
            editingId === c.id ? (
              <CollectionForm
                key={c.id}
                initialName={c.name}
                initialDescription={c.description ?? ""}
                initialVisibility={c.visibility}
                submitLabel="Save"
                onSubmit={(values) => handleUpdate(c.id, values)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div key={c.id} className="rounded-md border border-white/[0.09] bg-charcoal p-4">
                <div
                  className="mb-3 flex aspect-video items-center justify-center overflow-hidden rounded-sm bg-charcoal-2 bg-cover bg-center"
                  style={c.coverUrl ? { backgroundImage: `url(${c.coverUrl})` } : undefined}
                >
                  {!c.coverUrl ? <span className="text-xs text-ash">No items yet</span> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/collections/${c.id}`} className="font-display text-base text-moonlight hover:underline">
                    {c.name}
                  </Link>
                  {c.visibility === "PRIVATE" ? (
                    <span className="rounded-sm border border-white/20 px-1.5 py-0.5 text-[10px] font-bold text-ash">
                      Private
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-ash">{c.itemCount} items</p>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingId(c.id)}
                    className="text-xs text-moonlight underline underline-offset-4"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="text-xs text-ember underline underline-offset-4"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
