'use client';

import React from 'react';
import Image from 'next/image';

const themes = [
  { name: 'Dinosaur', image: '/seo-samples/dinosaur-1.png', slug: 'dinosaur-coloring-pages' },
  { name: 'Unicorn', image: '/seo-samples/unicorn-1.png', slug: 'unicorn-coloring-pages' },
  { name: 'Dragon', image: '/seo-samples/dragon-1.png', slug: 'dragon-coloring-pages' },
  { name: 'Cat', image: '/seo-samples/cat-1.png', slug: 'cat-coloring-pages' },
  { name: 'Dog', image: '/seo-samples/dog-1.png', slug: 'dog-coloring-pages' },
  { name: 'Flower', image: '/seo-samples/flower-1.png', slug: 'flower-coloring-pages' },
  { name: 'Mandala', image: '/seo-samples/mandala-1.png', slug: 'mandala-coloring-pages' },
  { name: 'Ocean', image: '/seo-samples/ocean-1.png', slug: 'ocean-coloring-pages' },
  { name: 'Princess', image: '/seo-samples/princess-1.png', slug: 'princess-coloring-pages' },
  { name: 'Space', image: '/seo-samples/space-1.png', slug: 'space-coloring-pages' },
  { name: 'Christmas', image: '/seo-samples/christmas-1.png', slug: 'christmas-coloring-pages' },
  { name: 'Halloween', image: '/seo-samples/halloween-1.png', slug: 'halloween-coloring-pages' },
  { name: 'Farm Animals', image: '/seo-samples/farm-animals-1.png', slug: 'farm-animals-coloring-pages' },
  { name: 'Alphabet', image: '/seo-samples/alphabet-1.png', slug: 'alphabet-coloring-pages' },
];

// 2 rows for now (14 themes). Row3 opens when 20+ themes.
// Each row max 10. New themes append to existing rows first.
const ROW_SIZE = 10;
const row1 = themes.slice(0, Math.min(themes.length, ROW_SIZE));
const row2 = themes.slice(ROW_SIZE, Math.min(themes.length, ROW_SIZE * 2));
const row3 = themes.slice(ROW_SIZE * 2, Math.min(themes.length, ROW_SIZE * 3));

function ColoringCard({ theme }: { theme: (typeof themes)[0] }) {
  return (
    <a
      href={`/${theme.slug}`}
      className="flex-shrink-0 w-[130px] md:w-[150px]"
    >
      <div
        className="bg-white rounded-2xl overflow-hidden border-2 border-transparent hover:border-[#FFB800] hover:shadow-xl hover:scale-105 transition-all duration-300"
        style={{ boxShadow: '0 4px 12px rgba(26,26,46,0.08)' }}
      >
        <div className="relative w-full aspect-[3/4] bg-white">
          <Image
            src={theme.image}
            alt={theme.name + ' coloring page'}
            fill
            className="object-contain p-2"
            sizes="150px"
          />
        </div>
      </div>
    </a>
  );
}

function MarqueeRow({ items, direction }: { items: typeof themes; direction: 'left' | 'right' }) {
  if (items.length === 0) return null;

  const animationName = direction === 'left' ? 'marquee-left' : 'marquee-right';
  // Duplicate once for seamless infinite loop (CSS marquee technique)
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
        {duplicated.map((theme, i) => (
          <ColoringCard key={`${theme.slug}-${i}`} theme={theme} />
        ))}
      </div>
    </div>
  );
}

export function ColoringGallery() {
  return (
    <section className="py-16 md:py-24 bg-[#F5F0E8] relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl text-center mb-10 md:mb-14">
        <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
          Popular Coloring Pages
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          A peek at our most-loved coloring pages. Want something unique? Create your own!
        </p>
        <a
          href="/generate"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-all hover:translate-y-0.5 text-[#1A1A2E] mt-6"
          style={{
            background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)',
            boxShadow: '0 2px 8px rgba(255,184,0,0.3)',
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
