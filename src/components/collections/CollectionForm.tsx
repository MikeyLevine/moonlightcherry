"use client";

import { useState, type FormEvent } from "react";
import type { CollectionVisibility } from "@prisma/client";
import { Button } from "@/components/ui/Button";

export type CollectionFormValues = { name: string; description: string; visibility: CollectionVisibility };

export function CollectionForm({
  initialName = "",
  initialDescription = "",
  initialVisibility = "PUBLIC",
  submitLabel = "Create collection",
  onSubmit,
  onCancel,
}: {
  initialName?: string;
  initialDescription?: string;
  initialVisibility?: CollectionVisibility;
  submitLabel?: string;
  onSubmit: (values: CollectionFormValues) => Promise<{ ok: boolean; error?: string }>;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [visibility, setVisibility] = useState<CollectionVisibility>(initialVisibility);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const result = await onSubmit({ name, description, visibility });
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-md border border-white/10 bg-charcoal p-5">
      <div>
        <label htmlFor="collection-name" className="mb-1.5 block text-sm font-bold text-moonlight">
          Name
        </label>
        <input
          id="collection-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-sm border border-white/15 bg-void px-3 py-2 text-sm text-moonlight focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="collection-description" className="mb-1.5 block text-sm font-bold text-moonlight">
          Description
        </label>
        <textarea
          id="collection-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Optional"
          className="w-full rounded-sm border border-white/15 bg-void px-3 py-2 text-sm text-moonlight placeholder:text-ash focus:outline-none"
        />
      </div>
      <div className="flex gap-4 text-sm text-moonlight">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            checked={visibility === "PUBLIC"}
            onChange={() => setVisibility("PUBLIC")}
            className="accent-cherry"
          />
          Public
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            checked={visibility === "PRIVATE"}
            onChange={() => setVisibility("PRIVATE")}
            className="accent-cherry"
          />
          Private
        </label>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="text" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        {error ? <span className="text-sm text-ember">{error}</span> : null}
      </div>
    </form>
  );
}
