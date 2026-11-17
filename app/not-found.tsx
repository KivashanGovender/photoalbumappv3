import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f3eee6] px-4 py-10 text-stone-950 sm:px-6">
      <div className="grid w-full max-w-md gap-4">
        <p className="text-sm font-bold tracking-[0.2em] uppercase">EventAlbum</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Page not found</h1>
        <p className="text-sm font-medium leading-6 text-stone-800">
          That link does not open an event, scrapbook, or page.
        </p>
        <Link
          href="/"
          className="inline-flex h-12 w-fit items-center rounded-full bg-stone-950 px-6 text-base font-bold text-white"
        >
          Back to EventAlbum
        </Link>
      </div>
    </main>
  );
}
