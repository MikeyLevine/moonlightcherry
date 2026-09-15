"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/lib/users/actions";
import { Button } from "@/components/ui/Button";

const fieldClasses =
  "w-full rounded-sm border border-white/15 bg-charcoal px-3 py-2.5 text-sm text-moonlight placeholder:text-ash focus:outline-none";

export function ProfileSettingsForm({
  initialUsername,
  initialBio,
  initialWebsiteUrl,
  initialTwitterHandle,
  initialNsfwEnabled,
}: {
  initialUsername: string;
  initialBio: string;
  initialWebsiteUrl: string;
  initialTwitterHandle: string;
  initialNsfwEnabled: boolean;
}) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl);
  const [twitterHandle, setTwitterHandle] = useState(initialTwitterHandle);
  const [nsfwEnabled, setNsfwEnabled] = useState(initialNsfwEnabled);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      const result = await updateProfile({ username, bio, websiteUrl, twitterHandle, nsfwEnabled });
      if (result.ok) {
        setStatus("saved");
        router.refresh();
      } else {
        setStatus("error");
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex max-w-lg flex-col gap-5">
      <div>
        <label htmlFor="username" className="mb-1.5 block text-sm font-bold text-moonlight">
          Username
        </label>
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={fieldClasses}
        />
        <p className="mt-1 text-xs text-ash">
          Your profile is at moonlightcherry.xyz/u/{username || "…"}
        </p>
      </div>

      <div>
        <label htmlFor="bio" className="mb-1.5 block text-sm font-bold text-moonlight">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={280}
          className={fieldClasses}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="website" className="mb-1.5 block text-sm font-bold text-moonlight">
            Website
          </label>
          <input
            id="website"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://…"
            className={fieldClasses}
          />
        </div>
        <div>
          <label htmlFor="twitter" className="mb-1.5 block text-sm font-bold text-moonlight">
            Twitter / X handle
          </label>
          <input
            id="twitter"
            value={twitterHandle}
            onChange={(e) => setTwitterHandle(e.target.value)}
            placeholder="handle"
            className={fieldClasses}
          />
        </div>
      </div>

      <div className="rounded-md border border-white/10 bg-charcoal p-4">
        <label className="flex items-start gap-3 text-sm text-moonlight">
          <input
            type="checkbox"
            checked={nsfwEnabled}
            onChange={(e) => setNsfwEnabled(e.target.checked)}
            className="mt-0.5 accent-cherry"
          />
          <span>
            I am 18 or older and want to see NSFW content.
            <span className="mt-1 block text-xs text-ash">
              Off by default. Turning this on shows adult artwork across the site; anonymous
              visitors and opted-out accounts never see it, no matter what.
            </span>
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        {status === "saved" ? <span className="text-sm text-ash">Saved.</span> : null}
        {status === "error" ? <span className="text-sm text-ember">{error}</span> : null}
      </div>
    </form>
  );
}
