import Link from "next/link";

const chipClasses = (active: boolean, className: string) =>
  `rounded-full border px-4 py-2 font-accent text-sm font-medium tracking-tight transition-colors ${
    active
      ? "border-cherry bg-cherry text-on-cherry"
      : "border-white/15 bg-charcoal text-ash hover:border-moonlight hover:text-moonlight"
  } ${className}`;

type ChipProps = {
  active?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
};

export function Chip({ active = false, className = "", children, onClick }: ChipProps) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={chipClasses(active, className)}>
      {children}
    </button>
  );
}

type ChipLinkProps = {
  href: string;
  active?: boolean;
  className?: string;
  children: React.ReactNode;
};

/** Same visual as Chip, but a real link for navigation instead of a toggle button. */
export function ChipLink({ href, active = false, className = "", children }: ChipLinkProps) {
  return (
    <Link href={href} className={`inline-flex ${chipClasses(active, className)}`}>
      {children}
    </Link>
  );
}
