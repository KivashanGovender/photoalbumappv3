export const THEMES = [
  "vintage",
  "editorial",
  "junk",
  "pastel",
  "cabin",
  "y2k",
  "tropical",
  "pet",
  "baby",
  "neon",
] as const;

export type ScrapbookTheme = (typeof THEMES)[number];

export const SCRAPBOOK_TEMPLATES = [
  "vintage-explorer",
  "modern-polaroid",
  "contemporary-collage",
] as const;

export const COFFEE_TABLE_TEMPLATES = [
  "heritage-monograph",
  "architectural-minimalist",
  "avant-garde",
] as const;

export const ALBUM_TEMPLATES = [
  ...SCRAPBOOK_TEMPLATES,
  ...COFFEE_TABLE_TEMPLATES,
] as const;

export type AlbumTemplateId = (typeof ALBUM_TEMPLATES)[number];

export type AlbumLook = ScrapbookTheme | AlbumTemplateId;

export const THEME_GROUPS: Array<{ label: string; options: readonly AlbumLook[] }> = [
  { label: "Styles", options: THEMES },
  { label: "Scrapbooks", options: SCRAPBOOK_TEMPLATES },
  { label: "Coffee Table Books", options: COFFEE_TABLE_TEMPLATES },
];

export const ALBUM_TEMPLATE_LABELS: Record<AlbumTemplateId, string> = {
  "vintage-explorer": "Vintage Explorer",
  "modern-polaroid": "Modern Polaroid",
  "contemporary-collage": "Contemporary Collage",
  "heritage-monograph": "Heritage Monograph",
  "architectural-minimalist": "Architectural Minimalist",
  "avant-garde": "Avant-Garde",
};

export function isAlbumTemplate(value: string | null | undefined): value is AlbumTemplateId {
  return Boolean(value && (ALBUM_TEMPLATES as readonly string[]).includes(value));
}

export function albumLookLabel(look: AlbumLook) {
  return isAlbumTemplate(look) ? ALBUM_TEMPLATE_LABELS[look] : THEME_LABELS[look];
}

export const THEME_LABELS: Record<ScrapbookTheme, string> = {
  vintage: "Vintage Polaroid",
  editorial: "Editorial Wedding",
  junk: "Junk Journal",
  pastel: "Pastel Celebration",
  cabin: "Winter Cabin",
  y2k: "90s Y2K",
  tropical: "Beach Sunset",
  pet: "Pet Memory",
  baby: "Baby Milestone",
  neon: "Neon Night",
};

const LEGACY: Record<string, ScrapbookTheme> = {
  polaroid: "vintage",
  collage: "pastel",
  editorial: "editorial",
  junk: "junk",
};

export type ThemePaint = {
  background: string;
  ink: string;
  muted: string;
  accent: string;
  titleFont: string;
  bodyFont: string;
  frame: "polaroid" | "gold" | "neon" | "film" | "plain" | "wood" | "soft";
};

export type ThemeStyle = {
  dark: boolean;
  tilt: boolean;
  strips: boolean;
  page: string;
  cover: string;
  title: string;
  meta: string;
  chapter: string;
  canvas: string;
  grid: string;
  tile: string;
  caption: string;
  byline: string;
  button: string;
  fontFamily: string;
  paint: ThemePaint;
};

const paint = (value: ThemePaint) => value;

export function themeStyle(theme: ScrapbookTheme): ThemeStyle {
  const styles: Record<ScrapbookTheme, ThemeStyle> = {
    vintage: {
      dark: false,
      tilt: true,
      strips: false,
      page: "bg-[#f3e6cf] text-stone-950",
      cover: "bg-[#f6ead4] text-stone-950",
      title: "text-4xl text-amber-950 sm:text-6xl",
      meta: "text-amber-900",
      chapter: "font-medium text-amber-950",
      canvas: "rounded-3xl bg-[#f4e2c4] p-3 sm:p-5",
      grid: "grid grid-cols-1 gap-8 overflow-x-clip sm:grid-cols-2 lg:grid-cols-3",
      tile: "rounded-sm border border-[#e7d3b1] bg-[#fffaf3] p-3 pb-8 shadow-md",
      caption: "text-base leading-7 text-stone-800",
      byline: "text-xs text-amber-900",
      button: "bg-amber-950 text-[#fffaf3]",
      fontFamily: '"Segoe Script", "Brush Script MT", cursive',
      paint: paint({
        background: "#f3e6cf",
        ink: "#3f2a1d",
        muted: "#8a5a32",
        accent: "#d7a15e",
        titleFont: '64px "Segoe Script", cursive',
        bodyFont: '36px "Segoe Script", cursive',
        frame: "polaroid",
      }),
    },
    editorial: {
      dark: false,
      tilt: false,
      strips: false,
      page: "bg-[#f7f3ea] text-stone-950",
      cover: "bg-[#fbf8f2] text-stone-950",
      title: "text-4xl tracking-tight sm:text-6xl",
      meta: "tracking-[0.18em] text-stone-700 uppercase",
      chapter: "tracking-tight text-stone-950",
      canvas: "bg-transparent",
      grid: "grid min-w-0 grid-cols-1 gap-10 overflow-x-clip sm:grid-cols-2 lg:grid-cols-3",
      tile: "overflow-hidden border border-[#D4AF37] bg-white",
      caption: "font-serif text-base leading-7 text-stone-900",
      byline: "text-xs tracking-wide text-stone-700 uppercase",
      button: "bg-stone-950 text-white",
      fontFamily: 'Georgia, "Times New Roman", serif',
      paint: paint({
        background: "#f7f3ea",
        ink: "#1c1917",
        muted: "#57534e",
        accent: "#D4AF37",
        titleFont: "64px Georgia, serif",
        bodyFont: "36px Georgia, serif",
        frame: "gold",
      }),
    },
    junk: {
      dark: true,
      tilt: true,
      strips: false,
      page: "bg-[#1c342b] text-[#f4ecdc]",
      cover: "bg-[#243f34] text-[#f4ecdc]",
      title: "text-4xl sm:text-6xl",
      meta: "text-[#d9c7a4]",
      chapter: "text-[#f4ecdc]",
      canvas: "rounded-sm bg-[#2a241c] p-3 sm:p-4",
      grid: "grid grid-cols-1 gap-6 overflow-x-clip sm:grid-cols-2 lg:grid-cols-3",
      tile: "border-2 border-dashed border-[#c4b48a] bg-[#efe6d4] p-2 text-stone-950 shadow",
      caption: "font-mono text-sm leading-6 text-stone-900",
      byline: "font-mono text-xs text-stone-800",
      button: "bg-[#1c342b] text-[#f4ecdc]",
      fontFamily: '"Courier New", Courier, monospace',
      paint: paint({
        background: "#1c342b",
        ink: "#f4ecdc",
        muted: "#d9c7a4",
        accent: "#8c3a32",
        titleFont: '60px "Courier New", monospace',
        bodyFont: '32px "Courier New", monospace',
        frame: "plain",
      }),
    },
    pastel: {
      dark: false,
      tilt: false,
      strips: false,
      page: "bg-gradient-to-br from-pink-100 via-rose-50 to-violet-100 text-stone-950",
      cover: "bg-white/70 text-stone-950",
      title: "text-4xl sm:text-6xl",
      meta: "text-fuchsia-900",
      chapter: "text-fuchsia-950",
      canvas: "rounded-[2rem] bg-white/40 p-3 sm:p-5",
      grid: "grid grid-cols-1 gap-6 overflow-x-clip sm:grid-cols-2 lg:grid-cols-3",
      tile: "overflow-hidden rounded-3xl bg-white shadow-lg shadow-pink-200/80",
      caption: "text-base leading-7 text-stone-800",
      byline: "text-xs font-semibold text-fuchsia-800",
      button: "bg-fuchsia-700 text-white",
      fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
      paint: paint({
        background: "#f8d7e8",
        ink: "#4a1942",
        muted: "#9d4e8c",
        accent: "#c4b5fd",
        titleFont: '64px "Trebuchet MS", sans-serif',
        bodyFont: '34px "Trebuchet MS", sans-serif',
        frame: "soft",
      }),
    },
    cabin: {
      dark: false,
      tilt: false,
      strips: false,
      page: "bg-[#d9ddd6] text-stone-950",
      cover: "bg-[#3e5348] text-[#f6f1e7]",
      title: "text-4xl sm:text-6xl",
      meta: "text-[#d5e0d4]",
      chapter: "text-[#1f2a24]",
      canvas: "rounded-3xl bg-[#e7e2d8] p-3 sm:p-5",
      grid: "grid grid-cols-1 gap-6 overflow-x-clip sm:grid-cols-2 lg:grid-cols-3",
      tile: "overflow-hidden rounded-xl border-8 border-[#8b5a2b] bg-[#f7f1e6] shadow",
      caption: "font-serif text-base leading-7 text-stone-900",
      byline: "text-xs text-[#6b4a2b]",
      button: "bg-[#3e5348] text-[#f6f1e7]",
      fontFamily: 'Georgia, "Palatino Linotype", serif',
      paint: paint({
        background: "#d9ddd6",
        ink: "#1f2a24",
        muted: "#3e5348",
        accent: "#8b5a2b",
        titleFont: "64px Georgia, serif",
        bodyFont: "34px Georgia, serif",
        frame: "wood",
      }),
    },
    y2k: {
      dark: false,
      tilt: true,
      strips: false,
      page: "bg-white text-stone-950",
      cover: "bg-[linear-gradient(90deg,#111_25%,#f5f5f4_25%,#f5f5f4_50%,#111_50%,#111_75%,#f5f5f4_75%)] bg-[length:32px_32px] text-fuchsia-600",
      title: "text-4xl uppercase sm:text-6xl",
      meta: "text-cyan-700",
      chapter: "text-fuchsia-700 uppercase",
      canvas: "rounded-none bg-white p-2",
      grid: "grid grid-cols-1 gap-6 overflow-x-clip sm:grid-cols-2 lg:grid-cols-3",
      tile: "border-4 border-black bg-black text-white shadow-[6px_6px_0_#ff2bd6]",
      caption: "text-sm leading-6 text-white",
      byline: "text-xs font-bold text-cyan-300 uppercase",
      button: "bg-[#ff2bd6] text-black",
      fontFamily: 'Impact, "Arial Black", sans-serif',
      paint: paint({
        background: "#111111",
        ink: "#fafafa",
        muted: "#67e8f9",
        accent: "#ff2bd6",
        titleFont: '64px Impact, "Arial Black", sans-serif',
        bodyFont: '32px Impact, "Arial Black", sans-serif',
        frame: "film",
      }),
    },
    tropical: {
      dark: false,
      tilt: true,
      strips: false,
      page: "bg-[#fbf6ef] text-stone-950",
      cover: "bg-gradient-to-r from-[#ff8a5b] via-[#ffb35a] to-[#ffe0a3] text-stone-950",
      title: "text-4xl sm:text-6xl",
      meta: "text-orange-950",
      chapter: "text-orange-950",
      canvas: "rounded-3xl bg-[#fff7ee] p-3 sm:p-5",
      grid: "grid grid-cols-1 gap-8 overflow-x-clip sm:grid-cols-2 lg:grid-cols-3",
      tile: "rounded-2xl border border-orange-200 bg-white p-2 shadow-md",
      caption: "text-base leading-7 text-stone-800",
      byline: "text-xs font-semibold text-orange-800",
      button: "bg-[#e36b45] text-white",
      fontFamily: '"Segoe UI", "Trebuchet MS", sans-serif',
      paint: paint({
        background: "#fff1e4",
        ink: "#4a2418",
        muted: "#c45c38",
        accent: "#ff8a5b",
        titleFont: '64px "Segoe UI", sans-serif',
        bodyFont: '34px "Segoe UI", sans-serif',
        frame: "plain",
      }),
    },
    pet: {
      dark: false,
      tilt: false,
      strips: false,
      page: "bg-[#fff4c2] text-stone-950",
      cover: "bg-[#e7f8ef] text-stone-950",
      title: "text-4xl sm:text-6xl",
      meta: "text-emerald-900",
      chapter: "text-emerald-950",
      canvas: "rounded-[2rem] bg-[#fff8d8] p-3 sm:p-5",
      grid: "grid grid-cols-1 gap-6 overflow-x-clip sm:grid-cols-2 lg:grid-cols-3",
      tile: "overflow-hidden rounded-3xl border-4 border-dotted border-emerald-600 bg-white",
      caption: "text-base leading-7 text-stone-800",
      byline: "text-xs font-bold text-emerald-800",
      button: "bg-emerald-700 text-white",
      fontFamily: '"Trebuchet MS", "Segoe UI Rounded", sans-serif',
      paint: paint({
        background: "#fff4c2",
        ink: "#1f3d32",
        muted: "#3f8f6b",
        accent: "#f6c445",
        titleFont: '64px "Trebuchet MS", sans-serif',
        bodyFont: '34px "Trebuchet MS", sans-serif',
        frame: "soft",
      }),
    },
    baby: {
      dark: false,
      tilt: false,
      strips: false,
      page: "bg-[#f7f1ea] text-stone-800",
      cover: "bg-[#fffdfb] text-stone-800",
      title: "text-4xl sm:text-6xl",
      meta: "text-stone-600",
      chapter: "text-stone-800",
      canvas: "rounded-[2rem] bg-[#fffaf6] p-3 sm:p-5",
      grid: "grid grid-cols-1 gap-8 overflow-x-clip sm:grid-cols-2 lg:grid-cols-3",
      tile: "overflow-hidden rounded-[1.75rem] bg-white shadow-[0_0_0_8px_rgba(255,248,240,1),0_10px_30px_rgba(180,160,140,0.25)]",
      caption: "font-serif text-base leading-7 text-stone-700",
      byline: "text-xs text-stone-500",
      button: "bg-stone-700 text-white",
      fontFamily: '"Palatino Linotype", Palatino, "Segoe Script", serif',
      paint: paint({
        background: "#f7f1ea",
        ink: "#5c5148",
        muted: "#a89888",
        accent: "#f3d7c4",
        titleFont: '60px "Palatino Linotype", serif',
        bodyFont: '34px "Palatino Linotype", serif',
        frame: "soft",
      }),
    },
    neon: {
      dark: true,
      tilt: false,
      strips: true,
      page: "bg-[#0D0D12] text-white",
      cover: "bg-[#14141c] text-white",
      title: "text-4xl tracking-tight uppercase sm:text-6xl",
      meta: "text-[#00F0FF]",
      chapter: "text-[#FF2A85] uppercase",
      canvas: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
      grid: "grid gap-2 rounded-2xl border border-[#00F0FF] p-2 shadow-[0_0_18px_rgba(255,42,133,0.35)]",
      tile: "overflow-hidden rounded-xl border border-[#FF2A85] bg-[#12121a] shadow-[0_0_12px_rgba(0,240,255,0.25)]",
      caption: "text-sm leading-6 text-stone-100",
      byline: "text-xs tracking-wide text-[#00F0FF] uppercase",
      button: "bg-[#FF2A85] text-white",
      fontFamily: '"Segoe UI", Arial, sans-serif',
      paint: paint({
        background: "#0D0D12",
        ink: "#f8fafc",
        muted: "#00F0FF",
        accent: "#FF2A85",
        titleFont: '60px "Segoe UI", sans-serif',
        bodyFont: '32px "Segoe UI", sans-serif',
        frame: "neon",
      }),
    },
  };

  return styles[theme];
}

export function parseAlbumLook(value: string | null | undefined): AlbumLook {
  if (isAlbumTemplate(value)) {
    return value;
  }

  return parseTheme(value);
}

export function parseTheme(value: string | null | undefined): ScrapbookTheme {
  if (value && (THEMES as readonly string[]).includes(value)) {
    return value as ScrapbookTheme;
  }

  if (value && value in LEGACY) {
    return LEGACY[value];
  }

  if (value?.startsWith("canva:")) {
    return "editorial";
  }

  return "editorial";
}

export function guestLine(names: Array<string | null | undefined>) {
  const unique = [...new Set(names.map((name) => name?.trim()).filter((name): name is string => Boolean(name)))];

  if (unique.length === 0) {
    return "Photos from the guests";
  }

  if (unique.length <= 3) {
    return unique.join(", ");
  }

  return `${unique.slice(0, 3).join(", ")} and ${unique.length - 3} more`;
}
