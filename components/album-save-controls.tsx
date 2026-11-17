"use client";

import { useState, useTransition } from "react";
import { inviteLink, saveAlbum } from "@/app/actions/album";
import { fieldClass, primaryButton, secondaryButton } from "@/components/ui";
import type { AlbumLook } from "@/lib/themes";

export function AlbumSaveControls({
  slug,
  title,
  subtitle,
  theme,
}: {
  slug: string;
  title: string;
  subtitle: string;
  theme: AlbumLook;
}) {
  const [titleValue, setTitleValue] = useState(title);
  const [subtitleValue, setSubtitleValue] = useState(subtitle);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await saveAlbum(slug, {
        title: titleValue,
        subtitle: subtitleValue,
        theme,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Album saved");
    });
  }

  function copyInvite() {
    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await inviteLink(slug);
      if (result.error || !result.path) {
        setError(result.error ?? "The invite link could not be created.");
        return;
      }
      const url = `${window.location.origin}${result.path}`;
      try {
        await navigator.clipboard.writeText(url);
        setMessage("Invite link copied");
      } catch {
        setError(url);
      }
    });
  }

  return (
    <section className="grid gap-3 rounded-3xl border-2 border-stone-950 bg-white p-4 sm:p-5" aria-label="Save album">
      <div className="grid gap-1">
        <h2 className="text-lg font-bold">Save album</h2>
        <p className="text-sm font-medium text-stone-800">
          Saves this title, subtitle, and the theme selected below.
        </p>
      </div>
      <label className="grid gap-1 text-sm font-semibold">
        Title
        <input
          value={titleValue}
          maxLength={120}
          onChange={(event) => setTitleValue(event.target.value)}
          className={`${fieldClass} h-12`}
        />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        Subtitle
        <input
          value={subtitleValue}
          maxLength={160}
          onChange={(event) => setSubtitleValue(event.target.value)}
          className={`${fieldClass} h-12`}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={save} disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : "Save Album"}
        </button>
        <button type="button" onClick={copyInvite} disabled={pending} className={secondaryButton}>
          Copy Invite Link
        </button>
      </div>
      {message ? (
        <p className="text-sm font-semibold text-stone-950" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm font-semibold break-all text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
