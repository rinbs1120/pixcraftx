'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const themes = [
  { name: 'Dinosaur', image: '/seo-samples/dinosaur-1.png', href: '/dinosaur-coloring-pages' },
  { name: 'Unicorn', image: '/seo-samples/unicorn-1.png', href: '/unicorn-coloring-pages' },
  { name: 'Mandala', image: '/seo-samples/mandala-1.png', href: '/mandala-coloring-pages' },
  { name: 'Alphabet', image: '/seo-samples/alphabet-1.png', href: '/alphabet-coloring-pages' },
  { name: 'Ocean', image: '/seo-samples/ocean-1.png', href: '/ocean-coloring-pages' },
  { name: 'Princess', image: '/seo-samples/princess-1.png', href: '/princess-coloring-pages' },
  { name: 'Space', image: '/seo-samples/space-1.png', href: '/space-coloring-pages' },
  { name: 'Christmas', image: '/seo-samples/christmas-1.png', href: '/christmas-coloring-pages' },
  { name: 'Halloween', image: '/seo-samples/halloween-1.png', href: '/halloween-coloring-pages' },
  { name: 'Farm Animals', image: '/seo-samples/farm-animals-1.png', href: '/farm-animals-coloring-pages' },
];

const row1 = themes.slice(0, 5);
const row2 = themes.slice(5, 10);

function ColoringCard({ theme }: { theme: (typeof themes)[0] }) {
  return (
    <Link
      href={theme.href}
      className="coloring-card flex-shrink-0 w-[180px] md:w-[200px] no-underline"
    >
      <div className="coloring-card-inner bg-white rounded-2xl overflow-hidden border-2 border-transparent transition-all duration-300 hover:border-[#FFB800] hover:shadow-xl hover:scale-105"
        style={{ boxShadow: '0 4px 12px rgba(26,26,46,0.08)' }}
      >
        <div className="relative w-full aspect-[3/4] bg-[#FFFBF0]">
          <Image
            src={theme.image}
            alt={`${theme.name} coloring pages`}
            fill
            className="object-contain p-2"
            sizes="200px"
          />
        </div>
        <div className="px-3 py-2.5 text-center bg-white">
          <span className="text-sm font-display text-[#1A1A2E] transition-colors">
            {theme.name}
          </span>
        </div>
      </div>
    </Link>
  );
}

function MarqueeRow({ items, direction }: { items: (typeof themes); direction: 'left' | 'right' }) {
  const animationName = direction === 'left' ? 'marquee-left' : 'marquee-right';

  return (
    <div className="marquee-viewport overflow-hidden py-2">
      <div
        className="marquee-track flex gap-4 md:gap-6"
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
    <section className="coloring-gallery py-16 md:py-24 bg-[#F5F0E8] relative overflow-hidden">
      {/* Section Title */}
      <div className="container mx-auto px-4 md:px-6 max-w-6xl text-center mb-10 md:mb-14">
        <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
          Browse Free Coloring Pages
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Explore hundreds of free printable coloring pages across popular themes — from dinosaurs to mandalas.
        </p>
      </div>

      {/* Marquee Rows - hover on the section pauses animation */}
      <div className="marquee-container space-y-4">
        <MarqueeRow items={row1} direction="left" />
        <MarqueeRow items={row2} direction="right" />
      </div>

      {/* Inline keyframes via style tag */}
      <style jsx global>{`
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }

        /* Pause marquee on hover over the section */
        .coloring-gallery:hover .marquee-track {
          animation-play-state: paused !important;
        }

        /* Card hover color change */
        .coloring-card:hover .coloring-card-inner span {
          color: #FFB800;
        }
      `}</style>
    </section>
  );
}
