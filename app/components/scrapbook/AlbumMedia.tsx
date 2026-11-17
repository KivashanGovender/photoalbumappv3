"use client";

import { useState } from "react";

export type AlbumMediaItem = {
  id?: string;
  photoId?: string;
  url?: string;
  caption?: string;
  ai_caption?: string;
  media_type?: "image" | "video" | null;
  poster_path?: string | null;
};

export function albumMediaSrc(media: AlbumMediaItem) {
  if (media.url) {
    return media.url;
  }

  const id = media.id || media.photoId;
  return id ? `/api/photos/${id}` : "";
}

function posterSrc(path: string | null | undefined) {
  if (!path) {
    return undefined;
  }

  if (path.startsWith("/") || path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return undefined;
}

export default function AlbumMedia({
  media,
  className,
  alt,
}: {
  media: AlbumMediaItem;
  className?: string;
  alt: string;
}) {
  const src = albumMediaSrc(media);
  const [muted, setMuted] = useState(true);

  if (!src) {
    return null;
  }

  if (media.media_type === "video") {
    return (
      <div className="relative h-full w-full">
        <video
          src={src}
          poster={posterSrc(media.poster_path)}
          autoPlay
          loop
          muted={muted}
          playsInline
          crossOrigin="anonymous"
          className={`h-full w-full object-cover ${className ?? ""}`}
        />
        <button
          type="button"
          data-export-ignore="true"
          data-album-export="ignore"
          aria-label={muted ? "Unmute video" : "Mute video"}
          aria-pressed={!muted}
          onClick={() => setMuted((current) => !current)}
          className="absolute right-2 bottom-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/45 text-white"
        >
          {muted ? <MutedIcon /> : <UnmutedIcon />}
        </button>
      </div>
    );
  }

  return (
    // Same-origin photo route, or a caller-supplied URL.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} crossOrigin="anonymous" className={className} />
  );
}

function MutedIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M4 9h3.2L12 5.2v13.6L7.2 15H4V9zm12.1 3 2.2-2.2 1.1 1.1L17.2 13l2.2 2.1-1.1 1.1-2.2-2.2-2.1 2.2-1.1-1.1 2.2-2.1-2.2-2.2 1.1-1.1 2.1 2.2z" />
    </svg>
  );
}

function UnmutedIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M4 9h3.2L12 5.2v13.6L7.2 15H4V9zm10.2-1.6 1.4 1.2a4.5 4.5 0 0 1 0 6.8l-1.4 1.2a6.2 6.2 0 0 0 0-9.2zm3-2.4 1.3 1.3a8 8 0 0 1 0 11.4l-1.3 1.3a9.8 9.8 0 0 0 0-14z" />
    </svg>
  );
}
