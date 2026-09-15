"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

const ACCEPTED = "image/jpeg,image/png,image/webp,image/avif,image/gif";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) return;

    setStatus("uploading");
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setError(data.error ?? "Upload failed.");
      return;
    }

    router.push(`/i/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
      <h1 className="text-4xl text-moonlight sm:text-5xl">Upload</h1>
      <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-ash">
        JPG, PNG, WEBP, AVIF, or GIF. Full metadata — tags, character, series, NSFW flag — is
        coming in a later phase; this exercises the real validation, storage, and variant
        pipeline end to end.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex max-w-md flex-col gap-4">
        <input
          type="file"
          accept={ACCEPTED}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-ash file:mr-4 file:rounded-sm file:border file:border-white/15 file:bg-charcoal file:px-4 file:py-2 file:text-sm file:font-bold file:text-moonlight"
        />
        <input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-sm border border-white/15 bg-charcoal px-4 py-2.5 text-sm text-moonlight placeholder:text-ash focus:outline-none"
        />
        <Button type="submit" variant="primary" disabled={!file || status === "uploading"}>
          {status === "uploading" ? "Uploading…" : "Upload"}
        </Button>
        {error ? <p className="text-sm text-ember">{error}</p> : null}
      </form>
    </div>
  );
}
