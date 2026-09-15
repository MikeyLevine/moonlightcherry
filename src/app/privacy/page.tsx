import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <StubPage
      title="Privacy policy"
      description="A real privacy policy — covering what's collected, OAuth data, cookies, and data retention — needs actual legal review before launch, not generated. This route is a placeholder for that document, not the document itself."
    />
  );
}
