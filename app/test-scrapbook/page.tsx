'use client';
import React from 'react';
import VintageExplorer from '@/app/components/scrapbook/templates/scrapbook-styles/VintageExplorer';
import ModernPolaroid from '@/app/components/scrapbook/templates/scrapbook-styles/ModernPolaroid';
import ContemporaryCollage from '@/app/components/scrapbook/templates/scrapbook-styles/ContemporaryCollage';
import HeritageMonograph from '@/app/components/scrapbook/templates/coffee-table-styles/HeritageMonograph';
import ArchitecturalMinimalist from '@/app/components/scrapbook/templates/coffee-table-styles/ArchitecturalMinimalist';
import AvantGarde from '@/app/components/scrapbook/templates/coffee-table-styles/AvantGarde';

export default function TestScrapbookPage() {
  const mockPhotos = [
    { id: '1', url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205', ai_caption: 'Opening night chaos!' },
    { id: '2', url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18', ai_caption: 'Best group photo ever.' },
    { id: '3', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30', ai_caption: 'Late night celebration.' },
    { id: '4', url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf', ai_caption: 'Under the lights.' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-8 md:p-12 space-y-16">
      
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-900">Complete Album Template Suite (6 Styles)</h1>
        <p className="text-gray-600 mt-2">
          Previewing both the Handmade Scrapbook collection and the Editorial Coffee Table collection.
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-20">
        
        {/* --- SCRAPBOOK STYLES --- */}
        <div className="space-y-12">
          <h2 className="text-xl font-mono text-amber-400 uppercase tracking-widest border-b border-amber-400/30 pb-2">
            Part 1: Tactile Scrapbook Series
          </h2>

          <section>
            <span className="text-xs font-bold uppercase tracking-wider bg-[#3d2914] text-[#f4ebd0] px-3 py-1 rounded inline-block mb-3">
              Vintage Explorer (Pixar Style)
            </span>
            <VintageExplorer title="The Adventure Begins" subtitle="Summer Roadtrip • 2026" photos={mockPhotos} />
          </section>

          <section>
            <span className="text-xs font-bold uppercase tracking-wider bg-gray-800 text-white px-3 py-1 rounded inline-block mb-3">
              Modern Polaroid Grid
            </span>
            <ModernPolaroid title="Birthday Weekend" subtitle="Memories with the crew" photos={mockPhotos} />
          </section>

          <section>
            <span className="text-xs font-bold uppercase tracking-wider bg-black text-white px-3 py-1 rounded inline-block mb-3">
              Contemporary Mixed-Media
            </span>
            <ContemporaryCollage title="The Afterparty" subtitle="Unfiltered Moments" photos={mockPhotos} />
          </section>
        </div>

        {/* --- COFFEE TABLE STYLES --- */}
        <div className="space-y-12 pt-10 border-t border-neutral-700">
          <h2 className="text-xl font-mono text-cyan-400 uppercase tracking-widest border-b border-cyan-400/30 pb-2">
            Part 2: Coffee Table Editorial Series
          </h2>

          <section>
            <span className="text-xs font-bold uppercase tracking-wider bg-amber-700 text-white px-3 py-1 rounded inline-block mb-3">
              Heritage Monograph (Vintage Editorial)
            </span>
            <HeritageMonograph title="Retrospective" subtitle="A visual study in monochrome" photos={mockPhotos} />
          </section>

          <section>
            <span className="text-xs font-bold uppercase tracking-wider bg-neutral-200 text-black px-3 py-1 rounded inline-block mb-3">
              Architectural Minimalist (Modern Editorial)
            </span>
            <ArchitecturalMinimalist title="Spatial Harmony" subtitle="Clean lines & geometric grids" photos={mockPhotos} />
          </section>

          <section>
            <span className="text-xs font-bold uppercase tracking-wider bg-neutral-800 text-neutral-200 px-3 py-1 rounded inline-block mb-3">
              Avant-Garde (Contemporary Gallery)
            </span>
            <AvantGarde title="Exhibit Zero" subtitle="Modern gallery mosaic" photos={mockPhotos} />
          </section>
        </div>

      </div>
    </div>
  );
}