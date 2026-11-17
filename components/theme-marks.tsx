import type { ScrapbookTheme } from "@/lib/themes";

export function ThemeMarks({ theme }: { theme: ScrapbookTheme }) {
  if (theme === "vintage") {
    return (
      <>
        <span className="absolute top-4 left-6 h-6 w-16 -rotate-6 bg-rose-300/70" />
        <span className="absolute top-8 right-8 h-5 w-14 rotate-3 bg-sky-300/70" />
        <span className="absolute right-6 bottom-4 h-8 w-20 rotate-2 bg-[#c4a574]/80 [clip-path:polygon(0_20%,100%_0,100%_80%,0_100%)]" />
      </>
    );
  }

  if (theme === "junk") {
    return (
      <svg viewBox="0 0 80 80" className="absolute top-4 right-4 h-16 w-16 text-[#d7e2c8]" aria-hidden>
        <path fill="currentColor" d="M40 6c6 10 8 14 18 16-10 4-14 8-16 20-2-12-8-16-18-18 8-2 12-8 16-18z" />
        <circle cx="22" cy="58" r="6" fill="#c46b63" />
      </svg>
    );
  }

  if (theme === "pastel") {
    return (
      <span className="pointer-events-none absolute inset-0" aria-hidden>
        <span className="absolute top-6 left-8 h-2 w-2 rounded-full bg-pink-400" />
        <span className="absolute top-12 right-16 h-2 w-2 rounded-full bg-violet-400" />
        <span className="absolute bottom-8 left-1/3 h-2 w-2 rounded-full bg-amber-300" />
        <span className="absolute right-10 bottom-6 h-2 w-2 rounded-full bg-sky-300" />
      </span>
    );
  }

  if (theme === "y2k") {
    return <span className="absolute right-4 bottom-4 text-3xl" aria-hidden>✦ ★</span>;
  }

  if (theme === "tropical") {
    return (
      <svg viewBox="0 0 120 80" className="absolute right-0 bottom-0 h-24 w-36 text-emerald-800/70" aria-hidden>
        <path fill="currentColor" d="M70 70c-20-28-8-52 4-62 2 18 14 28 28 30-16 2-24 14-32 32z" />
        <path fill="currentColor" d="M74 68c18-20 40-18 48-8-22 0-34 6-48 8z" />
      </svg>
    );
  }

  if (theme === "pet") {
    return (
      <svg viewBox="0 0 64 64" className="absolute top-4 right-4 h-12 w-12 text-emerald-700" aria-hidden>
        <circle cx="16" cy="18" r="6" fill="currentColor" />
        <circle cx="32" cy="12" r="6" fill="currentColor" />
        <circle cx="48" cy="18" r="6" fill="currentColor" />
        <ellipse cx="32" cy="38" rx="14" ry="12" fill="currentColor" />
      </svg>
    );
  }

  if (theme === "baby") {
    return (
      <svg viewBox="0 0 80 40" className="absolute top-4 right-4 h-10 w-20 text-amber-200" aria-hidden>
        <path fill="currentColor" d="M28 8a14 14 0 1 0 0 24 10 10 0 1 1 0-24z" />
        <path fill="currentColor" d="M58 6l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
      </svg>
    );
  }

  return null;
}

export function TileMarks({ theme }: { theme: ScrapbookTheme }) {
  if (theme === "vintage") {
    return (
      <>
        <span className="absolute -top-1 left-3 z-10 h-4 w-12 -rotate-6 bg-rose-300/80" />
        <span className="absolute -top-1 right-4 z-10 h-4 w-10 rotate-3 bg-sky-300/80" />
      </>
    );
  }

  if (theme === "junk") {
    return (
      <span className="absolute top-3 right-3 z-10 grid h-12 w-12 place-items-center rounded-sm border-2 border-dashed border-[#8c3a32] text-[9px] font-bold text-[#8c3a32] uppercase">
        Post
      </span>
    );
  }

  if (theme === "y2k") {
    return <span className="absolute top-2 left-2 z-10 text-lg text-[#ffe600]">★</span>;
  }

  if (theme === "tropical") {
    return (
      <svg viewBox="0 0 48 32" className="absolute top-2 right-2 z-10 h-6 w-8 text-emerald-700" aria-hidden>
        <path fill="currentColor" d="M24 28c-10-12-4-22 2-26 1 8 6 12 12 13-8 1-10 6-14 13z" />
      </svg>
    );
  }

  if (theme === "pet") {
    return (
      <svg viewBox="0 0 32 32" className="absolute top-2 right-2 z-10 h-6 w-6 text-emerald-700" aria-hidden>
        <circle cx="8" cy="8" r="3" fill="currentColor" />
        <circle cx="16" cy="5" r="3" fill="currentColor" />
        <circle cx="24" cy="8" r="3" fill="currentColor" />
        <ellipse cx="16" cy="20" rx="7" ry="6" fill="currentColor" />
      </svg>
    );
  }

  if (theme === "baby") {
    return (
      <svg viewBox="0 0 40 20" className="absolute top-2 right-2 z-10 h-5 w-8 text-amber-300" aria-hidden>
        <path fill="currentColor" d="M14 4a7 7 0 1 0 0 12 5 5 0 1 1 0-12z" />
        <path fill="currentColor" d="M30 2l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />
      </svg>
    );
  }

  return null;
}
