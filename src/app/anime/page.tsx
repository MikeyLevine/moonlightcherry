import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const metadata: Metadata = { title: "Anime" };

export default function AnimePage() {
  return (
    <StubPage
      title="Anime & manga"
      description="Dedicated series pages with cover art, related characters, and popular uploads arrive with the series system. Each series will also get its own page, for example /anime/crescent-requiem."
      links={[{ href: "/anime/crescent-requiem", label: "See an example series page" }]}
    />
  );
}
