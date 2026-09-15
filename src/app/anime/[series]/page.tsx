import { StubPage } from "@/components/layout/StubPage";

export default async function SeriesPage({ params }: { params: Promise<{ series: string }> }) {
  const { series } = await params;
  const decoded = decodeURIComponent(series).replace(/-/g, " ");

  return (
    <StubPage
      title={decoded}
      description={`This series' description, related characters, and popular uploads will appear here once the series system is built. This confirms the dynamic route works: you're viewing /anime/${series}.`}
      links={[{ href: "/anime", label: "Back to all series" }]}
    />
  );
}
