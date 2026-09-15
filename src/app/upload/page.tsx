import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const metadata: Metadata = { title: "Upload" };

export default function UploadPage() {
  return (
    <StubPage
      title="Upload"
      description="The upload flow — file selection, preview, metadata, tags, character/series selection, and NSFW marking — arrives with the media pipeline and requires sign-in, which doesn't exist yet."
    />
  );
}
