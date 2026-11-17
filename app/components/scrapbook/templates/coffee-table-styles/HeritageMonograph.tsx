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

interface HeritageMonographProps {
  title: string;
  subtitle?: string;
  photos: PhotoItem[];
}

export default function HeritageMonograph({ title, subtitle, photos }: HeritageMonographProps) {
  // Use the first photo as the main editorial hero feature if available
  const heroPhoto = photos[0];
  const secondaryPhotos = photos.slice(1);

  const getPhotoSrc = (photo?: PhotoItem) => {
    if (!photo) return '';
    const photoIdRef = photo.id || photo.photoId;
    return photo.url || (photoIdRef ? `/api/photos/${photoIdRef}` : '');
  };

  return (
    <div className="relative w-full bg-[#1c1b18] text-[#f0eae1] p-8 md:p-14 rounded-lg shadow-2xl border border-[#333] overflow-hidden font-serif">
      
      {/* Top Editorial Header */}
      <div className="border-b border-[#333] pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end">
        <div>
          <span className="text-[10px] tracking-[0.3em] uppercase text-amber-600/80 font-sans">Monograph Series</span>
          <h2 className="text-3xl md:text-4xl font-light tracking-wide mt-1">{title}</h2>
          {subtitle && <p className="text-sm text-gray-400 italic mt-1 font-sans">{subtitle}</p>}
        </div>
        <span className="text-xs tracking-widest text-gray-500 mt-2 md:mt-0 font-sans">VOL. I</span>
      </div>

      {/* Editorial Spread Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
        
        {/* Left Side: Massive Hero Feature */}
        <div className="md:col-span-7 space-y-3">
          <div className="relative h-[350px] overflow-hidden border border-neutral-800 bg-neutral-900 shadow-xl">
            {heroPhoto && getPhotoSrc(heroPhoto) ? (
              <AlbumMedia
                media={heroPhoto}
                alt={heroPhoto.caption || heroPhoto.ai_caption || "Editorial feature"}
                className="h-full w-full object-cover contrast-[1.1]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-neutral-600">
                Photo unavailable
              </div>
            )}
          </div>
          {(heroPhoto?.caption || heroPhoto?.ai_caption) && (
            <p className="text-xs text-gray-400 font-sans italic tracking-wide">
              Fig. 1 — {heroPhoto.caption || heroPhoto.ai_caption}
            </p>
          )}
        </div>

        {/* Right Side: Minimalist Supporting Column */}
        <div className="md:col-span-5 flex flex-col justify-center space-y-6">
          <div className="border-l-2 border-amber-700/60 pl-4 py-2">
            <h3 className="text-sm uppercase tracking-widest text-amber-500 font-sans mb-1">Curator's Note</h3>
            <p className="text-xs text-gray-300 font-sans leading-relaxed">
              Timeless moments captured in precise monochrome and rich sepia geometry. Designed for permanent exhibition.
            </p>
          </div>

          {/* Secondary photo thumbnails if they exist */}
          <div className="grid grid-cols-2 gap-3">
            {secondaryPhotos.map((photo, index) => {
              const src = getPhotoSrc(photo);
              const displayCaption = photo.caption || photo.ai_caption;
              const photoKey = photo.id || photo.photoId || `photo-${index}`;
              return (
                <div key={photoKey} className="h-28 overflow-hidden border border-neutral-800 bg-neutral-900">
                  {src ? (
                    <AlbumMedia media={photo} alt={displayCaption || "Detail view"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] text-neutral-600">
                      Photo unavailable
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Footer page marker */}
      <div className="mt-12 text-center text-[10px] tracking-[0.2em] text-neutral-500 uppercase font-sans">
        Heritage Monograph • Published Collection
      </div>

    </div>
  );
}