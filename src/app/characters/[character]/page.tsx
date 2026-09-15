import { StubPage } from "@/components/layout/StubPage";

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ character: string }>;
}) {
  const { character } = await params;
  const decoded = decodeURIComponent(character).replace(/-/g, " ");

  return (
    <StubPage
      title={decoded}
      description={`This character's profile, related media, and tags will appear here once the characters system is built. This confirms the dynamic route works: you're viewing /characters/${character}.`}
      links={[{ href: "/characters", label: "Back to all characters" }]}
    />
  );
}
