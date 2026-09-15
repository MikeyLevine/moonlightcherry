import type { Metadata } from "next";
import { getPopularCategories } from "@/lib/media/query";
import { UploadForm } from "@/components/upload/UploadForm";

export const metadata: Metadata = { title: "Upload" };

export default async function UploadPage() {
  const categories = await getPopularCategories();

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
      <h1 className="text-4xl text-moonlight sm:text-5xl">Upload</h1>
      <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-ash">
        JPG, PNG, WEBP, AVIF, or GIF. Uploads publish automatically once processing finishes —
        moderation happens after publish, not before.
      </p>

      <UploadForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
