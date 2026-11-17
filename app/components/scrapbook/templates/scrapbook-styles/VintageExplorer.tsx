'use client';
import React from 'react';
import AlbumMedia from "@/app/components/scrapbook/AlbumMedia";

interface PhotoItem {
  id?: string;
  photoId?: string;
  url?: string;
  caption?: string;
  ai_caption?: string; // Updated to match your app's actual database schema
  media_type?: "image" | "video" | null;
  poster_path?: string | null;
}

interface VintageExplorerProps {
  title: string;
  subtitle?: string;
  photos: PhotoItem[];
}

export default function VintageExplorer({ title, subtitle, photos }: VintageExplorerProps) {
  return (
    <div className="relative w-full bg-[#f4ebd0] text-[#3d2914] p-8 md:p-12 rounded-lg shadow-2xl border-4 border-[#3d2914]/20 overflow-hidden font-serif">
      
      {/* Background Vintage Paper Texture Effect */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#3d2914_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

      {/* Header Banner */}
      <div className="text-center mb-8 relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold tracking-wider uppercase underline decoration-wavy decoration-[#8c5830]">{title}</h2>
        {subtitle && <p className="text-sm italic mt-2 opacity-80">{subtitle}</p>}
      </div>

      {/* Photo Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-center relative z-10 max-w-3xl mx-auto">
        {photos.map((photo, index) => {
          const rotationClass = index % 2 === 0 ? 'rotate-[-2deg]' : 'rotate-[3deg]';
          const photoIdRef = photo.id || photo.photoId;
          const photoKey = photoIdRef || `photo-${index}`;
          const imageSrc = photo.url || (photoIdRef ? `/api/photos/${photoIdRef}` : "");
          const displayCaption = photo.caption || photo.ai_caption;
          
          return (
            <div 
              key={photoKey} 
              className={`relative bg-[#fffdf9] p-3 pb-8 shadow-xl transition-transform hover:scale-105 ${rotationClass}`}
            >
              {/* Triangular Photo Corners using inline CSS clip-path */}
              <div className="absolute -top-1 -left-1 w-6 h-6 bg-[#1a1107]" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#1a1107]" style={{ clipPath: 'polygon(0 0, 100% 100%, 100% 0)' }}></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-[#1a1107]" style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }}></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#1a1107]" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}></div>

              {/* Photo Frame */}
              <div className="relative h-56 overflow-hidden border border-[#e6dbc2] bg-[#d9d0c1]">
                {imageSrc ? (
                  <AlbumMedia
                    media={photo}
                    alt={displayCaption || "Scrapbook memory"}
                    className="h-full w-full object-cover sepia-[0.15] contrast-[1.05]"
                  />
                ) : (
                  <p className="grid h-full place-items-center px-4 text-center text-sm text-[#3d2914]">Photo unavailable</p>
                )}
              </div>

              {/* Handwritten Caption */}
              {displayCaption && (
                <p className="mt-3 text-center text-sm text-[#2c1d0f] tracking-wide italic" style={{ fontFamily: 'cursive, sans-serif' }}>
                  "{displayCaption}"
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Decorative Stamp Accent */}
      <div className="absolute bottom-4 right-4 opacity-70 pointer-events-none">
        <div className="border-2 border-dashed border-[#8c5830] px-3 py-1 text-xs uppercase tracking-widest rotate-[-6deg]">
          Adventure Book • Archive
        </div>
      </div>

    </div>
  );
}