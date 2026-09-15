import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <StubPage
      title="Contact"
      description="A real contact channel — email or a support form — will replace this placeholder before launch."
    />
  );
}
