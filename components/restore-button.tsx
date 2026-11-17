"use client";

import { useState, useTransition } from "react";
import { restorePhoto } from "@/app/actions/photos";

export function RestoreButton({ photoId, slug }: { photoId: string; slug: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function restore() {
    setError("");
    startTransition(async () => {
      const result = await restorePhoto(photoId, slug);
      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={restore}
        disabled={pending}
        className="h-11 rounded-full border-2 border-stone-950 text-sm font-bold disabled:opacity-50"
      >
        {pending ? "Restoring…" : "Restore"}
      </button>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
