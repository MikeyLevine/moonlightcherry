type SearchFieldProps = {
  id: string;
  placeholder: string;
  className?: string;
};

export function SearchField({ id, placeholder, className = "" }: SearchFieldProps) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-md border border-white/15 bg-charcoal/80 px-4 py-[13px] backdrop-blur ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[17px] w-[17px] shrink-0 text-ash"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.6" y2="16.6" />
      </svg>
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <input
        id={id}
        name={id}
        type="text"
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-moonlight placeholder:text-ash focus:outline-none"
      />
    </div>
  );
}
