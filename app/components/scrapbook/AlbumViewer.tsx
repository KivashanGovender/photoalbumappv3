"use client";

import { forwardRef } from "react";
import VintageExplorer from "@/app/components/scrapbook/templates/scrapbook-styles/VintageExplorer";
import ModernPolaroid from "@/app/components/scrapbook/templates/scrapbook-styles/ModernPolaroid";
import ContemporaryCollage from "@/app/components/scrapbook/templates/scrapbook-styles/ContemporaryCollage";
import HeritageMonograph from "@/app/components/scrapbook/templates/coffee-table-styles/HeritageMonograph";
import ArchitecturalMinimalist from "@/app/components/scrapbook/templates/coffee-table-styles/ArchitecturalMinimalist";
import AvantGarde from "@/app/components/scrapbook/templates/coffee-table-styles/AvantGarde";

interface PhotoItem {
  id?: string;
  photoId?: string;
  url?: string;
  caption?: string;
  ai_caption?: string;
  media_type?: "image" | "video" | null;
  poster_path?: string | null;
}

interface AlbumViewerProps {
  templateId: string;
  title: string;
  subtitle?: string;
  photos: PhotoItem[];
}

const AlbumViewer = forwardRef<HTMLDivElement, AlbumViewerProps>(function AlbumViewer(
  { templateId, title, subtitle, photos },
  albumRef,
) {
  let sheet = <VintageExplorer title={title} subtitle={subtitle} photos={photos} />;

  if (templateId === "modern-polaroid") {
    sheet = <ModernPolaroid title={title} subtitle={subtitle} photos={photos} />;
  } else if (templateId === "contemporary-collage") {
    sheet = <ContemporaryCollage title={title} subtitle={subtitle} photos={photos} />;
  } else if (templateId === "heritage-monograph") {
    sheet = <HeritageMonograph title={title} subtitle={subtitle} photos={photos} />;
  } else if (templateId === "architectural-minimalist") {
    sheet = <ArchitecturalMinimalist title={title} subtitle={subtitle} photos={photos} />;
  } else if (templateId === "avant-garde") {
    sheet = <AvantGarde title={title} subtitle={subtitle} photos={photos} />;
  }

  return (
    <div ref={albumRef} className="album-sheet">
      {sheet}
    </div>
  );
});

export default AlbumViewer;
