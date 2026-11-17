"use client";

import { useEffect, useId, useRef, useState } from "react";

const STEPS = [
  ["Scan & Snap or Upload", "Guests open the event link, enter a first name, then take a photo or upload from their camera roll. Uploaded photos skip AI culling and appear in the album immediately."],
  ["AI Curation", "The host runs curation. Keepers are grouped into chapters with captions, and weak shots can be hidden."],
  ["Books & Themes", "Release the album, choose a scrapbook theme, and guests switch between the live feed and the book."],
  ["9:16 Story Exports", "Download a vertical story card with the photo, event name, date, and caption."],
] as const;

export function HowItWorks() {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    closeRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center rounded-full border-2 border-stone-950 bg-white px-4 text-sm font-semibold text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
      >
        How it works
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-stone-950/80 p-4"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="grid max-h-[90dvh] w-full max-w-lg gap-5 overflow-auto rounded-3xl bg-white p-6 text-stone-950 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id={titleId} className="text-2xl font-bold tracking-tight">
                How this site works
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                className="inline-flex h-10 items-center rounded-full border-2 border-stone-950 px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
              >
                Close
              </button>
            </div>
            <ol className="grid gap-4">
              {STEPS.map(([title, body], index) => (
                <li key={title} className="grid grid-cols-[auto_1fr] gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-stone-950 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block font-bold">{title}</span>
                    <span className="mt-1 block text-sm leading-6 text-stone-800">{body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </>
  );
}
