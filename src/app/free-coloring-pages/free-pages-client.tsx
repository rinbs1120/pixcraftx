'use client';

import Image from 'next/image';
import { themes } from '@/data/coloring-themes';
import { DownloadAuthButton } from '@/components/download-auth-button';
import { useState } from 'react';

const categories = ['All', ...Array.from(new Set(themes.map(t => t.category)))];

// Flatten: each sample image = one card, with parent theme info
interface SampleCard {
  image: string;
  alt: string;
  h1: string;
  metaDescription: string;
  category: string;
  slug: string;
}

const allSamples: SampleCard[] = themes.flatMap(theme =>
  theme.samples.map((sample, i) => ({
    image: sample,
    alt: theme.sampleAlts[i],
    h1: theme.h1,
    metaDescription: theme.metaDescription,
    category: theme.category,
    slug: theme.slug,
  }))
);

export function FreePagesClient() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredSamples = activeCategory === 'All'
    ? allSamples
    : allSamples.filter(s => s.category === activeCategory);

  return (
    <>
      {/* Category Filter */}
      <section className="container mx-auto px-4 md:px-6 max-w-6xl py-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'text-[#1A1A2E] shadow-sm'
                  : 'text-muted-foreground bg-white/60 hover:bg-white hover:text-foreground'
              }`}
              style={activeCategory === cat ? {
                background: '#FFB800',
                boxShadow: '0 2px 8px rgba(255,184,0,0.25)',
              } : {}}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Sample Image Grid - each image is its own card */}
      <section className="container mx-auto px-4 md:px-6 max-w-6xl pb-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredSamples.map((sample, idx) => (
            <div
              key={`${sample.slug}-${idx}`}
              className="group bg-white rounded-2xl overflow-hidden border-2 border-transparent hover:border-[#FFB800] hover:shadow-xl hover:scale-[1.03] transition-all duration-300"
              style={{ boxShadow: '0 4px 12px rgba(26,26,46,0.08)' }}
            >
              <div className="relative w-full aspect-[3/4] bg-white">
                <Image
                  src={sample.image}
                  alt={sample.alt}
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                />
              </div>
              <div className="p-2.5">
                <p className="text-xs font-semibold text-foreground truncate mb-1">{sample.h1}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">{sample.metaDescription}</p>
                <div className="flex gap-1.5">
                  <DownloadAuthButton href={sample.image} compact />
                  <a
                    href={"/color?src=" + encodeURIComponent("https://pixcraftx.com" + sample.image)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-full font-semibold text-[10px] transition-all text-[#1A1A2E]"
                    style={{
                      background: '#FFB800',
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2 0-.5-.18-.96-.5-1.33-.3-.35-.5-.81-.5-1.33 0-1.1.9-2 2-2h2.36C19.86 15.34 22 13.13 22 10c0-4.42-4.48-8-10-8z" fill="#F5F0E8" stroke="#1A1A2E" strokeWidth="1.5"/>
                      <circle cx="8" cy="9" r="1.8" fill="#FFB800"/>
                      <circle cx="12" cy="6.5" r="1.8" fill="#FFB800"/>
                      <circle cx="16" cy="9" r="1.8" fill="#2ECC71"/>
                      <circle cx="7.5" cy="13" r="1.8" fill="#9B59B6"/>
                      <circle cx="16.5" cy="13" r="1.8" fill="#3498DB"/>
                    </svg>
                    Color
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
