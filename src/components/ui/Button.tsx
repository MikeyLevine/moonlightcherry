import Link from "next/link";

type Variant = "primary" | "ghost" | "text";

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm text-sm font-bold px-[18px] py-[9px] transition-colors whitespace-nowrap";

const variantClasses: Record<Variant, string> = {
  primary: "bg-cherry text-on-cherry hover:bg-ember",
  ghost: "bg-transparent text-moonlight border border-white/15 hover:border-moonlight",
  text: "bg-transparent text-ash hover:text-moonlight px-1 py-[9px]",
};

type ButtonProps = {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
};

export function Button({
  variant = "primary",
  className = "",
  children,
  href,
  onClick,
  type = "button",
}: ButtonProps) {
  const classes = `${base} ${variantClasses[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
