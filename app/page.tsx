import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-[#f3eee6] text-stone-950">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <span className="text-sm font-semibold tracking-[0.2em] uppercase">
          EventAlbum
        </span>
        <nav className="flex items-center gap-4">
          <Link href="/me" className="text-sm font-semibold text-stone-950 underline">
            Saved Albums
          </Link>
          <Link href="/login" className="text-sm font-semibold text-stone-950 underline">
            Host sign in
          </Link>
        </nav>
      </header>
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-bold tracking-wide text-stone-800 uppercase">
          Shared event photos
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          One album for every guest at the event.
        </h1>
        <p className="mt-4 max-w-lg text-lg leading-8 text-stone-800">
          Create an event, share the guest link, and collect the photos in one
          place.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex h-12 w-fit items-center rounded-full bg-stone-950 px-6 text-base font-bold text-white"
        >
          Open host dashboard
        </Link>
      </section>
    </main>
  );
}
