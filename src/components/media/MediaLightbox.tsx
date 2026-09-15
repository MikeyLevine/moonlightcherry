"use client";

import { useEffect, useState } from "react";

type Props = {
  src: string;
  srcSet?: string;
  original: string;
  alt: string;
};

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

export function MediaLightbox({ src, srcSet, original, alt }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full cursor-zoom-in items-center justify-center"
        aria-label="View full size"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} srcSet={srcSet} alt={alt} className="max-h-[75vh] w-auto" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={alt || "Full size image"}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 text-moonlight"
            style={{ top: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={original}
            alt={alt}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
