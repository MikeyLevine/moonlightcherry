"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleCollectionMedia, createCollection } from "@/lib/collections/actions";
import { CollectionForm } from "@/components/collections/CollectionForm";
import { Button } from "@/components/ui/Button";

type CollectionOption = { id: string; name: string; inCollection: boolean };

export function AddToCollectionButton({
  mediaId,
  isAuthenticated,
  initialCollections,
}: {
  mediaId: string;
  isAuthenticated: boolean;
  initialCollections: CollectionOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [collections, setCollections] = useState(initialCollections);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setOpen((v) => !v);
  }

  function handleToggle(collectionId: string) {
    setCollections((prev) => prev.map((c) => (c.id === collectionId ? { ...c, inCollection: !c.inCollection } : c)));
    startTransition(async () => {
      const result = await toggleCollectionMedia(collectionId, mediaId);
      if (!result.ok) {
        setCollections((prev) =>
          prev.map((c) => (c.id === collectionId ? { ...c, inCollection: !c.inCollection } : c))
        );
      }
    });
  }

  async function handleCreate(values: { name: string; description: string; visibility: "PUBLIC" | "PRIVATE" }) {
    const result = await createCollection(values);
    if (!result.ok) return { ok: false, error: result.error };

    await toggleCollectionMedia(result.id, mediaId);
    setCollections((prev) => [{ id: result.id, name: values.name, inCollection: true }, ...prev]);
    setCreating(false);
    router.refresh();
    return { ok: true };
  }

  return (
    <div className="relative">
      <Button variant="ghost" onClick={handleOpen}>
        Save
      </Button>

      {open ? (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded-md border border-white/15 bg-charcoal p-3 shadow-lg">
          {collections.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {collections.map((c) => (
                <li key={c.id}>
                  <label className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-moonlight hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={c.inCollection}
                      onChange={() => handleToggle(c.id)}
                      disabled={isPending}
                      className="accent-cherry"
                    />
                    {c.name}
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-1.5 text-sm text-ash">No collections yet.</p>
          )}

          <div className="mt-2 border-t border-white/10 pt-2">
            {creating ? (
              <CollectionForm submitLabel="Create & save" onSubmit={handleCreate} onCancel={() => setCreating(false)} />
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="w-full rounded-sm px-2 py-1.5 text-left text-sm text-moonlight hover:bg-white/5"
              >
                + New collection
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
