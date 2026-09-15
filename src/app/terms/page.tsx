import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <StubPage
      title="Terms of service"
      description="Real terms of service — covering uploads, NSFW eligibility, prohibited content, and account rules — need to be drafted with actual legal review before launch, not generated. This route is a placeholder for that document, not the document itself."
    />
  );
}
