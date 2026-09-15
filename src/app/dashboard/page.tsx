import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <StubPage
      title="Dashboard"
      description="Your uploads, favorites, collections, and history will live here once accounts exist. This area requires sign-in."
    />
  );
}
