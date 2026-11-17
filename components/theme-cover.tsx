import { themeStyle, type ScrapbookTheme } from "@/lib/themes";
import { ThemeMarks } from "@/components/theme-marks";

export function ThemeCover({
  theme,
  title,
  date,
  guests,
  kicker = "EventAlbum",
}: {
  theme: ScrapbookTheme;
  title: string;
  date?: string | null;
  guests: string;
  kicker?: string;
}) {
  const style = themeStyle(theme);

  return (
    <section className={`relative overflow-hidden rounded-3xl px-5 py-10 sm:px-8 sm:py-14 ${style.cover}`}>
      <ThemeMarks theme={theme} />
      <div className={`relative grid gap-3 ${theme === "y2k" ? "rounded-2xl bg-white/90 p-4 text-stone-950 [&_h1]:text-stone-950 [&_p]:text-stone-800" : ""}`}>
        <p className={`text-xs font-bold tracking-[0.22em] uppercase ${style.meta}`}>{kicker}</p>
        <h1 className={`max-w-3xl font-semibold ${style.title}`} style={{ fontFamily: style.fontFamily }}>
          {title}
        </h1>
        {date ? <p className={`text-base font-semibold ${style.meta}`}>{date}</p> : null}
        <p className={`text-sm font-medium ${style.meta}`}>{guests}</p>
      </div>
    </section>
  );
}
