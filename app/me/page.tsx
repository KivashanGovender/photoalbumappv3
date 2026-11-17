import Link from "next/link";
import { Suspense } from "react";
import { findSavedAlbums, type SavedAlbum } from "@/lib/saved-albums";
import { formatEventDate } from "@/lib/events";

export default function SavedAlbumsPage() {
  return (
    <Suspense fallback={<p className="px-5 py-8 animate-pulse text-sm font-semibold text-stone-800">Loading saved albums…</p>}>
      <SavedAlbums />
    </Suspense>
  );
}

async function SavedAlbums() {
  const albums = await findSavedAlbums();

  return (
    <main className="flex min-h-dvh flex-col bg-[#f3eee6] text-stone-950">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-[0.2em] uppercase">
          EventAlbum
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-semibold underline">
            Host dashboard
          </Link>
        </nav>
      </header>
      <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saved Albums</h1>
          <p className="mt-2 text-sm font-medium text-stone-800">
            Albums you host, and private albums opened with your invite.
          </p>
        </div>
        {albums.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 px-6 py-16 text-center">
            <p className="text-lg font-medium">No saved albums yet</p>
            <p className="mt-2 text-sm font-medium text-stone-800">
              Create an album as a host, or open an invite link from someone who invited you.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4">
            {albums.map((album) => (
              <li key={album.id}>
                <AlbumCard album={album} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function AlbumCard({ album }: { album: SavedAlbum }) {
  const details = [album.eventDate ? formatEventDate(album.eventDate) : null, album.location]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link href={`/e/${album.slug}`} className="block rounded-2xl border border-stone-200 bg-white px-5 py-4 hover:border-stone-400">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">{album.title}</h2>
          {album.subtitle ? <p className="mt-1 text-sm font-medium text-stone-800">{album.subtitle}</p> : null}
          <p className="mt-1 text-sm font-medium text-stone-800">{details || "Date and location not set"}</p>
        </div>
        <span className="shrink-0 text-xs font-bold tracking-wide text-stone-800 uppercase">
          {album.role === "host" ? "Host" : "Invited"}
        </span>
      </div>
    </Link>
  );
}
