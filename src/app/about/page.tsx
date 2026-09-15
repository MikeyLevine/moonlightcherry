import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <StubPage
      title="About"
      description="A real about page — what Moonlight Cherry is, who runs it, and how to reach the team — will replace this once there's a launched product to describe."
    />
  );
}
