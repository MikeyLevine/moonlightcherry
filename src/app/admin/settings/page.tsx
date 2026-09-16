import type { Metadata } from "next";
import { SETTINGS_REGISTRY, getRawSiteSettings } from "@/lib/site-settings";
import { SiteSettingsForm } from "@/components/admin/SiteSettingsForm";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const current = await getRawSiteSettings();

  return (
    <div>
      <h1 className="text-3xl text-moonlight">Settings</h1>
      <p className="mt-2 max-w-[60ch] text-sm text-ash">
        Overrides for values that otherwise ship as fixed defaults in code. Anything left at its
        current value just keeps using that default — nothing here is required.
      </p>
      <SiteSettingsForm
        settings={SETTINGS_REGISTRY.map((s) => ({ key: s.key, label: s.label, group: s.group }))}
        current={current}
      />
    </div>
  );
}
