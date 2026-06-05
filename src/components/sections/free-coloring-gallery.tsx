'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { themes } from '@/data/coloring-themes';

interface FreeColoringGalleryProps {
  categories: string[];
}

export function FreeColoringGallery({ categories }: FreeColoringGalleryProps) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredThemes = activeCategory === 'All'
    ? themes
    : themes.filter(t => t.category === activeCategory);

  return (
    <section className="container mx-auto px-4 md:px-6 max-w-6xl pb-16">
      <div className="flex flex-wrap gap-2 mb-10">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              activeCategory === cat
                ? 'text-[#1A1A2E] shadow-md'
                : 'text-muted-foreground bg-white border border-border hover:border-primary/30 hover:text-primary'
            }`}
            style={activeCategory === cat ? {
              background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)',
              boxShadow: '0 2px 8px rgba(255,184,0,0.3)',
            } : {}}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
        {filteredThemes.map(theme => (
          <Link
            key={theme.slug}
            href={`/${theme.slug}`}
            className="group bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 hover:scale-[1.03]"
          >
            <div className="relative w-full aspect-[3/4] bg-[#FFFBF0]">
              <Image
                src={theme.samples[0]}
                alt={theme.h1}
                fill
                className="object-contain p-3"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
            </div>
            <div className="px-3 py-2.5 text-center bg-white">
              <span className="text-sm font-display text-foreground group-hover:text-primary transition-colors">
                {theme.h1.replace('Free ', '')}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
