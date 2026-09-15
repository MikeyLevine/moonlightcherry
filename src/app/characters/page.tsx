import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const metadata: Metadata = { title: "Characters" };

export default function CharactersPage() {
  return (
    <StubPage
      title="Characters"
      description="Dedicated character pages with related media, series association, and stats arrive with the characters system. Each character will also get its own page, for example /characters/aiko-tsuki."
      links={[{ href: "/characters/aiko-tsuki", label: "See an example character page" }]}
    />
  );
}
