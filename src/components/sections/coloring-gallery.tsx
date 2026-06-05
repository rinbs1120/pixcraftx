'use client';

import React from 'react';
import Image from 'next/image';

const themes = [
  { name: 'Dinosaur', image: '/seo-samples/dinosaur-1.png' },
  { name: 'Unicorn', image: '/seo-samples/unicorn-1.png' },
  { name: 'Mandala', image: '/seo-samples/mandala-1.png' },
  { name: 'Alphabet', image: '/seo-samples/alphabet-1.png' },
  { name: 'Ocean', image: '/seo-samples/ocean-1.png' },
  { name: 'Princess', image: '/seo-samples/princess-1.png' },
  { name: 'Space', image: '/seo-samples/space-1.png' },
  { name: 'Christmas', image: '/seo-samples/christmas-1.png' },
  { name: 'Halloween', image: '/seo-samples/halloween-1.png' },
  { name: 'Farm Animals', image: '/seo-samples/farm-animals-1.png' },
];

const row1 = themes.slice(0, 5);
const row2 = themes.slice(5, 10);

function ColoringCard({ theme }: { theme: (typeof themes)[0] }) {
  return (
    <div className="flex-shrink-0 w-[180px] md:w-[200px]">
      <div className="bg-white rounded-2xl overflow-hidden border-2 border-transparent hover:border-[#FFB800] hover:shadow-xl hover:scale-105 transition-all duration-300"
        style={{ boxShadow: '0 4px 12px rgba(26,26,46,0.08)' }}
      >
        <div className="relative w-full aspect-[3/2] bg-[#FFFBF0]">
          <Image
            src={theme.image}
            alt={`${theme.name} coloring page`}
            fill
            className="object-contain p-2"
            sizes="200px"
          />
        </div>
      </div>
    </div>
  );
}

function MarqueeRow({ items, direction }: { items: typeof themes; direction: 'left' | 'right' }) {
  const animationName = direction === 'left' ? 'marquee-left' : 'marquee-right';

  return (
    <div className="overflow-hidden py-2">
      <div
        className="flex gap-4 md:gap-6"
        style={{
          animation: `${animationName} 35s linear infinite`,
          width: 'max-content',
        }}
      >
        {items.map((theme) => (
          <ColoringCard key={`a-${theme.name}`} theme={theme} />
        ))}
        {items.map((theme) => (
          <ColoringCard key={`b-${theme.name}`} theme={theme} />
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
          Browse Free Coloring Pages
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Explore hundreds of free printable coloring pages across popular themes — from dinosaurs to mandalas.
        </p>
      </div>

      <div className="space-y-4">
        <MarqueeRow items={row1} direction="left" />
        <MarqueeRow items={row2} direction="right" />
      </div>

      <style jsx global>{`
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}
