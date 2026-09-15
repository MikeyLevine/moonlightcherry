import { StubPage } from "@/components/layout/StubPage";

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);

  return (
    <StubPage
      title={decoded}
      description={`Every upload tagged "${decoded}" will appear here once tagging is wired to the database. This confirms the dynamic route works: you're viewing /tags/${tag}.`}
      links={[{ href: "/tags", label: "Back to all tags" }]}
    />
  );
}
