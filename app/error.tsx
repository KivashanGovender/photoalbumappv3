"use client";

import Link from "next/link";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f3eee6] px-4 py-10 text-stone-950">
      <div className="grid w-full max-w-md gap-4">
        <p className="text-sm font-bold tracking-[0.2em] uppercase">EventAlbum</p>
        <h1 className="text-3xl font-bold tracking-tight">This page could not finish loading</h1>
        <p className="text-sm font-medium leading-6 text-stone-800">
          A connection timed out. The rest of the site is still available.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-12 items-center rounded-full bg-stone-950 px-6 text-base font-bold text-white"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-12 items-center rounded-full border-2 border-stone-950 bg-white px-5 text-sm font-semibold"
          >
            Back to EventAlbum
          </Link>
        </div>
      </div>
    </main>
  );
}
