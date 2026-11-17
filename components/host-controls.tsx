"use client";

import { useState, useTransition } from "react";
import { renameChapter, setAlbumReleased, setAlbumTheme, setPhotoHidden, updateCaption } from "@/app/actions/album";
import { THEME_GROUPS, albumLookLabel, type AlbumLook } from "@/lib/themes";

export function ThemePicker({ slug, theme }: { slug: string; theme: AlbumLook }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <div className="grid gap-2">
      <div className="grid gap-4">
        {THEME_GROUPS.map((group) => (
          <div key={group.label} className="grid gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-700">{group.label}</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={group.label}>
              {group.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={option === theme}
                  disabled={pending}
                  onClick={() => {
                    setError("");
                    startTransition(async () => {
                      const result = await setAlbumTheme(slug, option);
                      if (result.error) {
                        setError(result.error);
                      }
                    });
                  }}
                  className={`h-11 rounded-full px-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 disabled:opacity-50 ${option === theme ? "bg-stone-950 text-white" : "border-2 border-stone-950 bg-white text-stone-950"}`}
                >
                  {albumLookLabel(option)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

export function ReleaseToggle({ slug, released }: { slug: string; released: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <div className="grid gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={released}
        disabled={pending}
        onClick={() => {
          setError("");
          startTransition(async () => {
            const result = await setAlbumReleased(slug, !released);
            if (result.error) {
              setError(result.error);
            }
          });
        }}
        className="flex items-center justify-between gap-4 rounded-2xl border-2 border-stone-950 bg-stone-50 px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 disabled:opacity-50"
      >
        <span>
          <span className="block text-base font-bold">{pending ? "Saving…" : "Release Album"}</span>
          <span className="mt-1 block text-sm font-medium text-stone-800">
            {released ? "Guests can see the album and the book." : "Guests can take photos. The album stays private."}
          </span>
        </span>
        <span className={`relative h-8 w-14 shrink-0 rounded-full ${released ? "bg-stone-950" : "bg-stone-400"}`} aria-hidden>
          <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${released ? "left-7" : "left-1"}`} />
        </span>
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

export function CaptionEditor({ slug, photoId, caption }: { slug: string; photoId: string; caption: string }) {
  const [value, setValue] = useState(caption);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <label className="grid gap-1 text-sm">
      Caption
      <textarea
        value={value}
        rows={3}
        disabled={pending}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => {
          if (value.trim() === caption) {
            return;
          }
          startTransition(async () => {
            const result = await updateCaption(slug, photoId, value);
            setError(result.error ?? "");
          });
        }}
        className="rounded-lg border-2 border-stone-400 px-3 py-2 leading-6 focus:border-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
      />
      {error ? <span className="text-red-700">{error}</span> : null}
    </label>
  );
}

export function ChapterEditor({ slug, title }: { slug: string; title: string }) {
  const [value, setValue] = useState(title);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <input
      value={value}
      disabled={pending}
      aria-label="Chapter title"
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => {
        if (value.trim() === title) {
          return;
        }
        startTransition(async () => {
          const result = await renameChapter(slug, title, value);
          setError(result.error ?? "");
        });
      }}
      className="w-full bg-transparent text-lg font-bold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
    />
  );
}

export function HideButton({ slug, photoId }: { slug: string; photoId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await setPhotoHidden(slug, photoId, true);
        });
      }}
      className="h-11 rounded-full border-2 border-stone-950 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 disabled:opacity-50"
    >
      {pending ? "Hiding…" : "Hide"}
    </button>
  );
}
