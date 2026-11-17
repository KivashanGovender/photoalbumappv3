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

interface ContemporaryCollageProps {
  title: string;
  subtitle?: string;
  photos: PhotoItem[];
}

export default function ContemporaryCollage({ title, subtitle, photos }: ContemporaryCollageProps) {
  return (
    <div className="relative w-full bg-[#fffdf9] text-[#1a1a1a] p-8 md:p-12 rounded-lg shadow-xl border border-dashed border-[#8c8c8c] overflow-hidden font-mono">
      
      {/* Background notebook dots */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:14px_14px] pointer-events-none"></div>

      {/* Header */}
      <div className="mb-8 border-b-2 border-black pb-3 flex justify-between items-end relative z-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight uppercase">{title}</h2>
          {subtitle && <p className="text-xs text-gray-600 mt-1 uppercase tracking-widest">{subtitle}</p>}
        </div>
        <span className="text-xs bg-black text-white px-2 py-1 uppercase tracking-wider">Collage Series</span>
      </div>

      {/* Asymmetric Mixed-Media Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 max-w-4xl mx-auto items-center">
        {photos.map((photo, index) => {
          const photoKey = photo.id || photo.photoId || index;
          const photoIdRef = photo.id || photo.photoId;
          const imageSrc = photo.url || (photoIdRef ? `/api/photos/${photoIdRef}` : '');
          const displayCaption = photo.caption || photo.ai_caption;
          
          // Make every third item span differently for a collage effect
          const spanClass = index === 0 && photos.length >= 3 ? 'md:col-span-2' : 'col-span-1';

          return (
            <div 
              key={photoKey}
              className={`relative border border-black/10 bg-white p-3 shadow-lg transition-transform hover:scale-[1.01] ${spanClass}`}
            >
              {/* Decorative corner tag element */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-black/80 rotate-45 pointer-events-none"></div>

              {/* Photo Frame with Fallback */}
              <div className="h-48 bg-gray-100 overflow-hidden relative mb-2">
                {imageSrc ? (
                  <AlbumMedia
                    media={photo}
                    alt={displayCaption || "Collage memory"}
                    className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-gray-50">
                    Photo unavailable
                  </div>
                )}
              </div>

              {/* Journal-style caption */}
              {displayCaption && (
                <p className="text-xs text-gray-800 font-sans tracking-wide pt-1 border-t border-gray-100">
                  // {displayCaption}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer marker tag */}
      <div className="mt-8 text-center text-xs text-gray-500 tracking-widest uppercase">
        — Mixed Media Visual Archive —
      </div>

    </div>
  );
}