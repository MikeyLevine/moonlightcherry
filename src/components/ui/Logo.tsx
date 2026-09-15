type LogoProps = {
  id?: string;
  className?: string;
  showWordmark?: boolean;
};

export function Logo({ id = "brand", className = "", showWordmark = true }: LogoProps) {
  const maskId = `moon-mask-${id}`;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 28 28" className="h-6 w-6 shrink-0 text-moonlight" aria-hidden="true">
        <mask id={maskId}>
          <rect width="28" height="28" fill="#fff" />
          <circle cx="17.5" cy="9.5" r="8.6" fill="#000" />
        </mask>
        <circle cx="13.5" cy="14" r="11" fill="currentColor" mask={`url(#${maskId})`} />
      </svg>
      {showWordmark ? (
        <span className="font-display text-lg font-semibold tracking-tight text-moonlight">
          Moonlight Cherry
        </span>
      ) : null}
    </span>
  );
}
