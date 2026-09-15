import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const metadata: Metadata = { title: "Tags" };

export default function TagsPage() {
  return (
    <StubPage
      title="Tags"
      description="Browsable, searchable tags with usage counts and related-tag suggestions arrive with the tagging system. Each tag will also get its own page, for example /tags/mecha."
      links={[{ href: "/tags/mecha", label: "See an example tag page" }]}
    />
  );
}
