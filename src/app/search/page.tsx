import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <StubPage
      title="Search"
      description={
        q
          ? `Full search isn't built yet, so "${q}" couldn't be searched for. Filtering by character, series, tag, uploader, category, and sort order arrives once the search API is built.`
          : "Full search with filtering by character, series, tag, uploader, category, and sort order arrives once the search API is built."
      }
      links={[{ href: "/gallery", label: "Browse the gallery instead" }]}
    />
  );
}
