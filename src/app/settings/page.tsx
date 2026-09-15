import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileSettingsForm } from "@/components/settings/ProfileSettingsForm";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/settings");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { username: true, bio: true, websiteUrl: true, twitterHandle: true, nsfwEnabled: true },
  });

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
      <h1 className="text-4xl text-moonlight sm:text-5xl">Settings</h1>
      <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-ash">
        Your public profile and content preferences.
      </p>

      <ProfileSettingsForm
        initialUsername={user.username ?? ""}
        initialBio={user.bio ?? ""}
        initialWebsiteUrl={user.websiteUrl ?? ""}
        initialTwitterHandle={user.twitterHandle ?? ""}
        initialNsfwEnabled={user.nsfwEnabled}
      />
    </div>
  );
}
