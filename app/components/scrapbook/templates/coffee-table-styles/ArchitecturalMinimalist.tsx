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

interface ArchitecturalMinimalistProps {
  title: string;
  subtitle?: string;
  photos: PhotoItem[];
}

export default function ArchitecturalMinimalist({ title, subtitle, photos }: ArchitecturalMinimalistProps) {
  const getPhotoSrc = (photo?: PhotoItem) => {
    if (!photo) return '';
    const photoIdRef = photo.id || photo.photoId;
    return photo.url || (photoIdRef ? `/api/photos/${photoIdRef}` : '');
  };

  return (
    <div className="relative w-full bg-[#ffffff] text-[#111111] p-8 md:p-14 rounded-lg shadow-xl border border-gray-200 overflow-hidden font-sans">
      
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-black pb-4">
        <div>
          <span className="text-xs font-bold tracking-[0.25em] uppercase text-gray-400">Design Series</span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight uppercase mt-1">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1 tracking-wide">{subtitle}</p>}
        </div>
        <div className="mt-2 md:mt-0 text-xs font-semibold uppercase tracking-widest bg-black text-white px-3 py-1">
          Minimalist Grid
        </div>
      </div>

      {/* Asymmetric grid. The first photo spans two columns when more than two photos are present. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {photos.map((photo, index) => {
          const src = getPhotoSrc(photo);
          const caption = photo.caption || photo.ai_caption;
          const photoKey = photo.id || photo.photoId || `photo-${index}`;
          const spanClass = index === 0 && photos.length >= 3 ? "md:col-span-2 h-[320px]" : "h-[320px]";

          return (
            <div key={photoKey} className={`group relative overflow-hidden border border-gray-200 bg-gray-100 ${spanClass}`}>
              {src ? (
                <AlbumMedia
                  media={photo}
                  alt={caption || "Architectural layout"}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                  Photo unavailable
                </div>
              )}

              {/* Caption overlay banner */}
              {caption && (
                <div className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-sm p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-xs font-medium tracking-wide">{caption}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-12 flex justify-between items-center text-xs text-gray-400 uppercase tracking-widest border-t border-gray-100 pt-4">
        <span>Architectural Edition</span>
        <span>Spread Layout</span>
      </div>

    </div>
  );
}