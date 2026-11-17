"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { moveScrapbookItem, setScrapbookTheme, updateScrapbookItem } from "@/app/actions/album";
import { StoryDownload } from "@/components/story-download";
import { THEME_LABELS, THEMES, type ScrapbookTheme } from "@/lib/themes";

export type ScrapbookPageItem = {
  id: string;
  photoId: string;
  caption: string;
  chapter: string;
  uploaderName: string;
};

export function ScrapbookEditor({
  scrapbookId,
  title,
  eventTitle,
  eventDate,
  theme,
  items,
}: {
  scrapbookId: string;
  title: string;
  eventTitle: string;
  eventDate: string | null;
  theme: ScrapbookTheme;
  items: ScrapbookPageItem[];
}) {
  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-5xl gap-8 bg-[#f3eee6] px-4 py-8 text-stone-950 sm:px-6 sm:py-10">
      <div className="grid gap-3">
        <Link href="/dashboard" className="w-fit text-sm font-semibold underline">
          My Events
        </Link>
        <p className="text-xs font-bold tracking-[0.2em] uppercase">Personal scrapbook</p>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((option) => (
            <ThemeButton key={option} scrapbookId={scrapbookId} option={option} active={option === theme} />
          ))}
        </div>
      </div>
      <ol className="grid gap-6">
        {items.map((item, index) => (
          <li key={item.id}>
            <ScrapbookCard
              scrapbookId={scrapbookId}
              item={item}
              eventTitle={eventTitle}
              eventDate={eventDate}
              first={index === 0}
              last={index === items.length - 1}
            />
          </li>
        ))}
      </ol>
    </main>
  );
}

function ThemeButton({
  scrapbookId,
  option,
  active,
}: {
  scrapbookId: string;
  option: ScrapbookTheme;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await setScrapbookTheme(scrapbookId, option);
        });
      }}
      className={`h-11 rounded-full px-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 disabled:opacity-50 ${active ? "bg-stone-950 text-white" : "border-2 border-stone-950 bg-white text-stone-950"}`}
    >
      {THEME_LABELS[option]}
    </button>
  );
}

function ScrapbookCard({
  scrapbookId,
  item,
  eventTitle,
  eventDate,
  first,
  last,
}: {
  scrapbookId: string;
  item: ScrapbookPageItem;
  eventTitle: string;
  eventDate: string | null;
  first: boolean;
  last: boolean;
}) {
  const [caption, setCaption] = useState(item.caption);
  const [chapter, setChapter] = useState(item.chapter);
  const [pending, startTransition] = useTransition();

  return (
    <article className="grid gap-4 rounded-2xl bg-white p-4 sm:grid-cols-[220px_1fr]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/api/photos/${item.photoId}`} alt="" className="aspect-[4/5] w-full rounded-xl object-cover" />
      <div className="grid content-start gap-3">
        <label className="grid gap-1 text-sm">
          Chapter
          <input
            value={chapter}
            onChange={(event) => setChapter(event.target.value)}
            onBlur={() => {
              if (chapter.trim() !== item.chapter) {
                startTransition(async () => {
                  await updateScrapbookItem(scrapbookId, item.id, { chapter });
                });
              }
            }}
            className="rounded-lg border-2 border-stone-400 px-3 py-2 focus:border-stone-950"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Caption
          <textarea
            value={caption}
            rows={3}
            onChange={(event) => setCaption(event.target.value)}
            onBlur={() => {
              if (caption.trim() !== item.caption) {
                startTransition(async () => {
                  await updateScrapbookItem(scrapbookId, item.id, { caption });
                });
              }
            }}
            className="rounded-lg border-2 border-stone-400 px-3 py-2 focus:border-stone-950"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <MoveButton scrapbookId={scrapbookId} itemId={item.id} direction="up" disabled={first || pending} />
          <MoveButton scrapbookId={scrapbookId} itemId={item.id} direction="down" disabled={last || pending} />
          <StoryDownload
            photoId={item.photoId}
            eventTitle={eventTitle}
            eventDate={eventDate}
            caption={caption}
            uploaderName={item.uploaderName}
          />
        </div>
      </div>
    </article>
  );
}

function MoveButton({
  scrapbookId,
  itemId,
  direction,
  disabled,
}: {
  scrapbookId: string;
  itemId: string;
  direction: "up" | "down";
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() => {
        startTransition(async () => {
          await moveScrapbookItem(scrapbookId, itemId, direction);
        });
      }}
      className="h-11 rounded-full border-2 border-stone-950 px-4 text-sm font-bold disabled:opacity-40"
    >
      {direction === "up" ? "Move up" : "Move down"}
    </button>
  );
}
