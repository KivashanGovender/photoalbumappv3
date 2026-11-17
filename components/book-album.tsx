"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AlbumDownload } from "@/components/album-download";
import { AlbumThemeSection } from "@/components/album-theme-switcher";
import { PhotoGrid, type AlbumPhoto } from "@/components/photo-grid";
import { ThemeCover } from "@/components/theme-cover";
import { guestLine, isAlbumTemplate, themeStyle, type AlbumLook } from "@/lib/themes";

export function BookAlbum({
  title,
  slug,
  eventDate,
  chapters,
  theme,
  isHost,
  locked = false,
}: {
  title: string;
  slug: string;
  eventDate: string | null;
  chapters: Array<[string, AlbumPhoto[]]>;
  theme: AlbumLook;
  isHost: boolean;
  locked?: boolean;
}) {
  const [look, setLook] = useState(theme);
  const albumRef = useRef<HTMLDivElement>(null);
  const style = isAlbumTemplate(look) ? null : themeStyle(look);
  const guests = guestLine(chapters.flatMap(([, photos]) => photos.map((photo) => photo.uploader_name)));

  return (
    <main className={`h-dvh ${style?.page ?? "bg-stone-100 text-stone-950"}`}>
      <div className="mx-auto h-dvh max-w-5xl overflow-y-auto">
        <div className={`sticky top-0 z-20 px-4 py-3 backdrop-blur sm:px-6 ${style?.page ?? "bg-stone-100 text-stone-950"}`}>
          <AlbumThemeSection
            slug={slug}
            theme={look}
            isHost={isHost}
            tone={style?.dark ? "dark" : "light"}
            onChange={setLook}
          />
          {locked ? null : <AlbumDownload slug={slug} albumRef={albumRef} />}
        </div>
        {locked ? (
          <section className="grid min-h-[50dvh] content-center gap-4 px-5 sm:px-8">
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm font-medium">The host has not released this book yet.</p>
            <Link href={`/e/${slug}`} className="w-fit text-sm font-semibold underline">
              Back to the album
            </Link>
          </section>
        ) : (
          <>
            <div className="px-4 pt-4 sm:px-6">
              <Link href={`/e/${slug}`} className="w-fit text-sm font-semibold underline">
                Back to the album
              </Link>
            </div>
            <div ref={albumRef}>
              <section className="grid gap-6 px-4 py-10 sm:px-8">
                {isAlbumTemplate(look) ? null : <ThemeCover theme={look} title={title} date={eventDate} guests={guests} />}
              </section>
              {chapters.map(([chapter, photos]) => (
                <section key={chapter} className="grid gap-6 px-4 py-12 sm:px-6 sm:py-16">
                  <h2 className={`text-3xl font-semibold ${style?.chapter ?? ""}`} style={style ? { fontFamily: style.fontFamily } : undefined}>
                    {chapter}
                  </h2>
                  <p className={`text-sm font-medium ${style?.meta ?? ""}`}>{photos.length === 1 ? "1 photo" : `${photos.length} photos`}</p>
                  <PhotoGrid photos={photos} eventTitle={title} eventDate={eventDate} theme={look} />
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
