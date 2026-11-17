'use client';
import React from 'react';
import AlbumMedia from "@/app/components/scrapbook/AlbumMedia";

interface PhotoItem {
  id?: string;
  photoId?: string;
  url?: string;
  caption?: string;
  ai_caption?: string;
  media_type?: "image" | "video" | null;
  poster_path?: string | null;
}

interface AvantGardeProps {
  title: string;
  subtitle?: string;
  photos: PhotoItem[];
}

export default function AvantGarde({ title, subtitle, photos }: AvantGardeProps) {
  const getPhotoSrc = (photo?: PhotoItem) => {
    if (!photo) return '';
    const photoIdRef = photo.id || photo.photoId;
    return photo.url || (photoIdRef ? `/api/photos/${photoIdRef}` : '');
  };

  return (
    <div className="relative w-full bg-[#111111] text-[#fcfcfc] p-8 md:p-14 rounded-lg shadow-2xl border border-[#262626] overflow-hidden font-sans">
      
      {/* Avant-Garde Floating Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-baseline border-b border-neutral-800 pb-4">
        <div>
          <span className="text-[10px] tracking-[0.4em] uppercase text-neutral-400">Contemporary Exhibit</span>
          <h2 className="text-3xl md:text-5xl font-light tracking-tighter uppercase mt-1">{title}</h2>
        </div>
        {subtitle && <p className="text-xs tracking-widest text-neutral-400 uppercase mt-2 md:mt-0">{subtitle}</p>}
      </div>

      {/* Mosaic gallery. The first photo is larger, and every later photo stays in the grid. */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl mx-auto items-center">
        {photos.map((photo, index) => {
          const src = getPhotoSrc(photo);
          const caption = photo.caption || photo.ai_caption;
          const photoKey = photo.id || photo.photoId || `photo-${index}`;
          let spanClass = "h-[260px] md:col-span-2";
          if (index === 0) spanClass = "h-[340px] md:col-span-2 md:row-span-2";
          if (index >= 2) spanClass = "h-[200px] md:col-span-1";

          return (
            <div key={photoKey} className={`group relative overflow-hidden border border-neutral-800 bg-neutral-900 ${spanClass}`}>
              {src ? (
                <AlbumMedia
                  media={photo}
                  alt={caption || "Gallery piece"}
                  className="h-full w-full object-cover grayscale-[0.3] transition-all duration-700 group-hover:grayscale-0"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs text-neutral-600">
                  Photo unavailable
                </div>
              )}

              {caption && (
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-[11px] tracking-wide text-neutral-200">{caption}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer minimal tag */}
      <div className="mt-10 flex justify-between items-center text-[10px] tracking-[0.3em] uppercase text-neutral-500 border-t border-neutral-900 pt-4">
        <span>Gallery Collection</span>
        <span>Spread 03</span>
      </div>

    </div>
  );
}