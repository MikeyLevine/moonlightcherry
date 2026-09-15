import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <StubPage
      title="Search"
      description="Full search with filtering by character, series, tag, uploader, category, and sort order arrives once the search API is built."
    />
  );
}
