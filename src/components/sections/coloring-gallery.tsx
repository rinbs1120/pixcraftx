'use client';

import React from 'react';
import Image from 'next/image';
import { themes } from '@/data/coloring-themes';

// Flatten all samples for marquee display (42 images from 14 themes × 3)
interface MarqueeItem {
  name: string;
  image: string;
  slug: string;
}

const allItems: MarqueeItem[] = themes.flatMap(theme =>
  theme.samples.map((sample, i) => ({
    name: `${theme.h1} #${i + 1}`,
    image: sample,
    slug: theme.slug,
  }))
);

// 42 items → 3 rows of 14
const ROW_SIZE = 14;
const row1 = allItems.slice(0, ROW_SIZE);
const row2 = allItems.slice(ROW_SIZE, ROW_SIZE * 2);
const row3 = allItems.slice(ROW_SIZE * 2);

function ColoringCard({ item }: { item: MarqueeItem }) {
  return (
    <div className="flex-shrink-0 w-[130px] md:w-[150px]">
      <div
        className="bg-white rounded-2xl overflow-hidden border-2 border-transparent hover:border-[#FFB800] hover:shadow-xl hover:scale-105 transition-all duration-300"
        style={{ boxShadow: '0 4px 12px rgba(26,26,46,0.08)' }}
      >
        <div className="relative w-full aspect-[3/4] bg-white">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-contain p-2"
            sizes="150px"
          />
        </div>
      </div>
    </div>
  );
}

function MarqueeRow({ items, direction }: { items: MarqueeItem[]; direction: 'left' | 'right' }) {
  if (items.length === 0) return null;

  const animationName = direction === 'left' ? 'marquee-left' : 'marquee-right';
  // Duplicate once for seamless infinite loop
  const duplicated = [...items, ...items];

  return (
    <div className="overflow-hidden py-2">
      <div
        className="flex gap-4 md:gap-6"
        style={{
          animation: `${animationName} 40s linear infinite`,
          width: 'max-content',
          willChange: 'transform',
        }}
      >
        {duplicated.map((item, i) => (
          <ColoringCard key={`${item.slug}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}

export function ColoringGallery() {
  return (
    <section className="py-20 md:py-28 bg-[#F5F0E8] relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl text-center mb-10 md:mb-14">
        <h2 className="font-display text-[32px] md:text-[40px] text-foreground mb-4" style={{ letterSpacing: '-0.5px' }}>
          Popular Coloring Pages
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          A peek at our most-loved coloring pages. Want something unique? Create your own!
        </p>
        <a
          href="/generate"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-all hover:translate-y-0.5 text-[#1A1A2E] mt-6"
          style={{
            background: '#FFB800',
            boxShadow: '0 2px 12px rgba(255,184,0,0.3)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Generate Your Own
        </a>
      </div>

      <div className="space-y-4">
        <MarqueeRow items={row1} direction="left" />
        <MarqueeRow items={row2} direction="right" />
        {row3.length > 0 && <MarqueeRow items={row3} direction="left" />}
      </div>
    </section>
  );
}
