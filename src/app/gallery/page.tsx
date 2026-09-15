import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const metadata: Metadata = { title: "Gallery" };

export default function GalleryPage() {
  return (
    <StubPage
      title="Gallery"
      description="The full masonry gallery — trending, recent uploads, and browsing by category — arrives with the media pipeline. This route is real and reachable at /gallery; it just doesn't have content yet."
    />
  );
}
