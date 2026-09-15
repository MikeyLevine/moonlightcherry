type ChipProps = {
  active?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
};

export function Chip({ active = false, className = "", children, onClick }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-4 py-2 font-accent text-sm font-medium tracking-tight transition-colors ${
        active
          ? "border-cherry bg-cherry text-on-cherry"
          : "border-white/15 bg-charcoal text-ash hover:border-moonlight hover:text-moonlight"
      } ${className}`}
    >
      {children}
    </button>
  );
}
