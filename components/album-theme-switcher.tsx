"use client";

import { useState, useTransition } from "react";
import { setAlbumTheme } from "@/app/actions/album";
import { THEME_GROUPS, albumLookLabel, type AlbumLook } from "@/lib/themes";

export function AlbumThemeSection({
  slug,
  theme,
  isHost,
  onChange,
  tone = "light",
}: {
  slug: string;
  theme: AlbumLook;
  isHost: boolean;
  onChange: (theme: AlbumLook) => void;
  tone?: "light" | "dark";
}) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const dark = tone === "dark";
  const idle = dark
    ? "border-2 border-white bg-transparent text-white"
    : "border-2 border-stone-950 bg-white text-stone-950";
  const active = dark ? "bg-white text-stone-950" : "bg-stone-950 text-white";

  function choose(nextTheme: AlbumLook) {
    setError("");
    onChange(nextTheme);

    if (!isHost) {
      return;
    }

    startTransition(async () => {
      const result = await setAlbumTheme(slug, nextTheme);
      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <section
      className={`grid gap-3 rounded-3xl p-4 sm:p-5 ${dark ? "border border-white/30 bg-white/10" : "border-2 border-stone-950 bg-white shadow-sm"}`}
      aria-label="Album theme"
    >
      <div className="grid gap-1">
        <h2 className={`text-lg font-bold ${dark ? "text-white" : "text-stone-950"}`}>Theme</h2>
        <p className={`text-sm font-medium ${dark ? "text-stone-200" : "text-stone-800"}`}>
          {isHost ? "This look is saved for everyone." : "This look updates on your screen right away."}
        </p>
      </div>
      <div className="grid gap-4">
        {THEME_GROUPS.map((group) => (
          <div key={group.label} className="grid gap-2">
            <h3 className={`text-xs font-bold uppercase tracking-wide ${dark ? "text-stone-200" : "text-stone-700"}`}>
              {group.label}
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label={group.label}>
              {group.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={option === theme}
                  disabled={pending}
                  onClick={() => choose(option)}
                  className={`min-h-11 rounded-full px-3 py-2 text-center text-xs font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 disabled:opacity-50 sm:text-sm ${option === theme ? active : idle}`}
                >
                  {albumLookLabel(option)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
    </section>
  );
}
