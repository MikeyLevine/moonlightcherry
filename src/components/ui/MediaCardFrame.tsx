type MediaCardFrameProps = {
  aspect?: string;
  className?: string;
  children?: React.ReactNode;
};

/**
 * Bare frame for a future media tile: fixed radius, hairline edge, and an
 * aspect box. The media pipeline (Phase 4) fills this with real images;
 * for now it just carries the shape of the component.
 */
export function MediaCardFrame({ aspect = "3 / 4", className = "", children }: MediaCardFrameProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-md border border-white/[0.09] bg-charcoal-2 ${className}`}
      style={{ aspectRatio: aspect }}
    >
      {children}
    </div>
  );
}
