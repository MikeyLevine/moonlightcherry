"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSiteSettings } from "@/lib/admin/settings-actions";

type Setting = { key: string; label: string; group: string };

export function SiteSettingsForm({ settings, current }: { settings: Setting[]; current: Record<string, number> }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, String(current[s.key])]))
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const groups = Array.from(new Set(settings.map((s) => s.group)));

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSiteSettings(values);
      if (!result.ok) return setError(result.error);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="mt-6 flex flex-col gap-8">
      {groups.map((group) => (
        <div key={group}>
          <h2 className="text-lg text-moonlight">{group}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {settings
              .filter((s) => s.group === group)
              .map((s) => (
                <label key={s.key} className="flex flex-col gap-1">
                  <span className="text-xs text-ash">{s.label}</span>
                  <input
                    type="number"
                    value={values[s.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
                    className="rounded-sm border border-white/15 bg-charcoal px-3 py-2 text-sm text-moonlight focus:outline-none"
                  />
                </label>
              ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-sm bg-cherry px-5 py-2.5 text-sm font-bold text-on-cherry disabled:opacity-50"
        >
          Save changes
        </button>
        {saved ? <p className="text-sm text-moonlight">Saved — takes effect immediately.</p> : null}
        {error ? <p className="text-sm text-ember">{error}</p> : null}
      </div>
    </div>
  );
}
