import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { SearchField } from "@/components/ui/SearchField";
import { MediaCardFrame } from "@/components/ui/MediaCardFrame";
import { Swatch } from "@/components/ui/Swatch";

export const metadata: Metadata = {
  title: "Design system",
};

const SWATCHES = [
  { name: "Void", hex: "#08080C" },
  { name: "Charcoal", hex: "#131018" },
  { name: "Cherry", hex: "#FF2A4D" },
  { name: "Ember", hex: "#FF6B84" },
  { name: "Moonlight", hex: "#FFFFFF" },
  { name: "Ash", hex: "#736F82" },
];

const TYPE_ROWS = [
  { tag: "Display / 60", className: "font-display text-[3.75rem] leading-none", text: "Moonlight" },
  { tag: "Display / 36", className: "font-display text-4xl", text: "A gallery at night" },
  { tag: "Display / 24", className: "font-display text-2xl", text: "Featured characters" },
  { tag: "Body / 18", className: "font-body text-lg", text: "Fan art, official art, and wallpapers from artists who never log off." },
  {
    tag: "Body / 16",
    className: "font-body text-base text-ash max-w-[52ch]",
    text: "Uploads are screened, tagged, and published automatically — moderation happens after publish, not before.",
  },
];

export default function DesignSystemPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
      <h1 className="text-4xl text-moonlight sm:text-5xl">Design system</h1>
      <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-ash">
        The approved Neon Temple token set and the component primitives built on top of it. This
        page is a living reference, not a public route — it exists so later phases build against
        the same shapes and colors.
      </p>

      <section className="mt-14">
        <h2 className="text-2xl text-moonlight">Color</h2>
        <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ash">
          Six named tokens. Void and Charcoal carry surfaces, Cherry and Ember carry the accent,
          Moonlight and Ash carry text.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
          {SWATCHES.map((s) => (
            <Swatch key={s.name} name={s.name} hex={s.hex} />
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl text-moonlight">Type</h2>
        <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ash">
          Bodoni Moda carries headlines and identity; Hanken Grotesk carries interface and body
          text. Unbounded is reserved for tags and labels only.
        </p>
        <div className="mt-6 divide-y divide-white/[0.09]">
          {TYPE_ROWS.map((row) => (
            <div key={row.tag} className="flex flex-wrap items-baseline gap-5 py-3.5">
              <span className="w-[110px] shrink-0 text-xs text-ash">{row.tag}</span>
              <span className={`${row.className} text-moonlight`}>{row.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl text-moonlight">Components</h2>
        <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ash">
          Buttons, chips, and fields in their real hover and focus states — tab through them to
          check keyboard focus.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3.5">
          <Button variant="primary">Upload artwork</Button>
          <Button variant="ghost">View collection</Button>
          <Button variant="text">Cancel</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3.5">
          <Chip active>Wallpapers</Chip>
          <Chip>Cosplay</Chip>
          <Chip>Mecha</Chip>
        </div>
        <div className="mt-4 max-w-xs">
          <SearchField id="ds-search" placeholder="Search tags, artists, series" />
        </div>
      </section>

      <section className="mt-16 pb-4">
        <h2 className="text-2xl text-moonlight">Media tile frame</h2>
        <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ash">
          The one radius and one border used across every media tile, regardless of aspect
          ratio. The media pipeline (Phase 4) fills this frame with real uploads.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MediaCardFrame aspect="3 / 4" className="bg-gradient-to-br from-charcoal-2 to-cherry/40" />
          <MediaCardFrame aspect="1 / 1" className="bg-gradient-to-br from-void to-charcoal-2" />
          <MediaCardFrame aspect="4 / 5" className="bg-gradient-to-br from-cherry/50 to-void" />
          <MediaCardFrame aspect="2 / 3" className="bg-gradient-to-br from-charcoal-2 to-ember/30" />
        </div>
      </section>
    </div>
  );
}
