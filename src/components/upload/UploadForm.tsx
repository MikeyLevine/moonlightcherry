"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { SeriesType } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { MetadataFields, type Category } from "@/components/media/MetadataFields";

const ACCEPTED = "image/jpeg,image/png,image/webp,image/avif,image/gif";

export function UploadForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [nsfw, setNsfw] = useState(false);
  const [tags, setTags] = useState("");
  const [character, setCharacter] = useState("");
  const [series, setSeries] = useState("");
  const [seriesType, setSeriesType] = useState<SeriesType>("ANIME");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(selected ? URL.createObjectURL(selected) : null);
  }

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;

    setStatus("uploading");
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("nsfw", String(nsfw));
    formData.append("tags", tags);
    formData.append("character", character);
    formData.append("series", series);
    formData.append("seriesType", seriesType);
    categoryIds.forEach((id) => formData.append("categoryIds", id));

    // XMLHttpRequest, not fetch, specifically because it exposes real
    // upload progress via xhr.upload.onprogress — fetch doesn't.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      let data: { id?: string; error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // Non-JSON response (e.g. a proxy error page) — fall through to the generic error below.
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.id) {
        router.push(`/i/${data.id}`);
      } else {
        setStatus("error");
        setError(data.error ?? "Upload failed.");
      }
    };
    xhr.onerror = () => {
      setStatus("error");
      setError("Upload failed — check your connection.");
    };
    xhr.send(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-8 lg:flex-row lg:gap-10">
      <div className="lg:w-80 lg:shrink-0">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md border border-white/15 bg-charcoal">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="h-full w-full object-contain" />
          ) : (
            <p className="p-6 text-center text-sm text-ash">Choose a file to preview it here</p>
          )}
        </div>
        <input
          type="file"
          accept={ACCEPTED}
          onChange={handleFileChange}
          required
          className="mt-3 w-full text-sm text-ash file:mr-4 file:rounded-sm file:border file:border-white/15 file:bg-charcoal file:px-4 file:py-2 file:text-sm file:font-bold file:text-moonlight"
        />
      </div>

      <div className="flex flex-1 flex-col gap-5">
        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-bold text-moonlight">
            Title
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full rounded-sm border border-white/15 bg-charcoal px-3 py-2.5 text-sm text-moonlight placeholder:text-ash focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-bold text-moonlight">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Description (optional)"
            className="w-full rounded-sm border border-white/15 bg-charcoal px-3 py-2.5 text-sm text-moonlight placeholder:text-ash focus:outline-none"
          />
        </div>

        <MetadataFields
          tags={tags}
          onTagsChange={setTags}
          character={character}
          onCharacterChange={setCharacter}
          series={series}
          onSeriesChange={setSeries}
          seriesType={seriesType}
          onSeriesTypeChange={setSeriesType}
          categories={categories}
          categoryIds={categoryIds}
          onToggleCategory={toggleCategory}
        />

        <label className="flex items-start gap-2.5 text-sm text-moonlight">
          <input
            type="checkbox"
            checked={nsfw}
            onChange={(e) => setNsfw(e.target.checked)}
            className="mt-0.5 accent-cherry"
          />
          <span>
            This is NSFW
            <span className="mt-0.5 block text-xs text-ash">
              Only visible to signed-in viewers who&rsquo;ve opted in to NSFW content in
              settings.
            </span>
          </span>
        </label>

        <div>
          <Button type="submit" variant="primary" disabled={!file || status === "uploading"}>
            {status === "uploading" ? `Uploading… ${progress}%` : "Upload"}
          </Button>
          {status === "uploading" ? (
            <div className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-charcoal">
              <div className="h-full bg-cherry transition-all" style={{ width: `${progress}%` }} />
            </div>
          ) : null}
          {error ? <p className="mt-3 text-sm text-ember">{error}</p> : null}
        </div>
      </div>
    </form>
  );
}
