import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <StubPage
      title="Messages"
      description="Direct messages between accounts arrive with the messaging system, well after core accounts and moderation are in place."
    />
  );
}
