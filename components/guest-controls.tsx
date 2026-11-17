"use client";

import { useState, useTransition } from "react";
import { createPersonalScrapbook, joinEvent, togglePick } from "@/app/actions/album";
import { primaryButton } from "@/components/ui";

export function SaveEventButton({ slug, initialName }: { slug: string; initialName: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <button
      type="button"
      disabled={pending || !initialName}
      onClick={() => {
        startTransition(async () => {
          const result = await joinEvent(slug, initialName);
          setMessage(result.error ?? "Saved to My Events.");
        });
      }}
      className="w-fit text-sm font-semibold text-stone-950 underline disabled:opacity-50"
    >
      {pending ? "Saving…" : message || "Keep this event"}
    </button>
  );
}

export function PickButton({ slug, photoId, picked }: { slug: string; photoId: string; picked: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <div className="grid gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError("");
          startTransition(async () => {
            const result = await togglePick(slug, photoId);
            if (result.error) {
              setError(result.error);
            }
          });
        }}
        className={`h-11 rounded-full text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 ${picked ? "bg-stone-950 text-white" : "border-2 border-stone-950"}`}
      >
        {picked ? "Selected" : "Select"}
      </button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

export function CreateScrapbookButton({ slug, count }: { slug: string; count: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <div className="grid gap-2">
      <button
        type="button"
        disabled={pending || count === 0}
        onClick={() => {
          setError("");
          startTransition(async () => {
            const result = await createPersonalScrapbook(slug);
            if (result?.error) {
              setError(result.error);
            }
          });
        }}
        className={primaryButton}
      >
        {pending ? "Building scrapbook…" : `Create personal scrapbook (${count})`}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
