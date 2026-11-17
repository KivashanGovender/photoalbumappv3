"use client";

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

interface ModernPolaroidProps {
  title: string;
  subtitle?: string;
  photos: PhotoItem[];
}

export default function ModernPolaroid({ title, subtitle, photos }: ModernPolaroidProps) {
  return (
    <div className="relative w-full bg-[#faf8f5] text-[#2b2b2b] p-8 md:p-12 rounded-lg shadow-xl border-2 border-[#e3dccb] overflow-hidden font-sans">
      
      {/* Subtle paper background texture */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#2b2b2b_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.03]"></div>

      {/* Header */}
      <div className="text-center mb-8 relative z-10">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-wide uppercase text-[#333]">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>

      {/* Asymmetric Polaroid Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10 max-w-3xl mx-auto items-center justify-center">
        {photos.map((photo, index) => {
          const photoKey = photo.id || photo.photoId || `photo-${index}`;
          const photoIdRef = photo.id || photo.photoId;
          const imageSrc = photo.url || (photoIdRef ? `/api/photos/${photoIdRef}` : '');
          const displayCaption = photo.caption || photo.ai_caption;
          
          // Subtle, clean tilt for modern stacking feel
          const tiltClass = index % 2 === 0 ? 'rotate-[-1deg]' : 'rotate-[1.5deg]';

          return (
            <div 
              key={photoKey}
              className={`relative border border-gray-200 bg-white p-3 pb-6 shadow-md transition-all hover:scale-[1.02] ${tiltClass}`}
            >
              {/* Faux metallic paperclip decoration on top center */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-3 bg-gray-400/80 rounded-sm shadow-sm pointer-events-none"></div>

              {/* Photo Frame with Fallback */}
              <div className="h-52 bg-gray-100 overflow-hidden relative mb-3 border border-gray-100">
                {imageSrc ? (
                  <AlbumMedia
                    media={photo}
                    alt={displayCaption || "Polaroid memory"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-gray-50">
                    Photo unavailable
                  </div>
                )}
              </div>

              {/* Caption */}
              {displayCaption && (
                <p className="text-center text-xs font-medium text-gray-700 tracking-wide px-2">
                  {displayCaption}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer stamp/date indicator */}
      <div className="mt-8 text-right text-[10px] tracking-widest text-gray-400 uppercase">
        Modern Polaroid Series • Collection
      </div>

    </div>
  );
}