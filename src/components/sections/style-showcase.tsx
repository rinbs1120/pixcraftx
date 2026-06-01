'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const styles = [
  {
    id: 'simple',
    name: 'Simple',
    tagline: 'Bold & Easy',
    description: 'Thick outlines, large areas to color. Perfect for young kids and quick projects.',
    bestFor: 'Ages 3-8, classrooms, party activities',
    color: '#FFB800',
    image: '/styles/simple.jpg',
  },
  {
    id: 'mandala',
    name: 'Mandala',
    tagline: 'Relaxing & Symmetrical',
    description: 'Circular symmetrical patterns that bring calm and focus. Great for mindfulness.',
    bestFor: 'Stress relief, adults, meditation',
    color: '#9B59B6',
    image: '/styles/mandala.jpg',
  },
  {
    id: 'intricate',
    name: 'Intricate',
    tagline: 'Detailed & Immersive',
    description: 'Fine lines, rich scenes with lots of detail. For those who love a coloring challenge.',
    bestFor: 'Adults, artists, KDP sellers',
    color: '#2ECC71',
    image: '/styles/intricate.jpg',
  },
];

export function StyleShowcase() {
  const [active, setActive] = useState('simple');
  const activeStyle = styles.find(s => s.id === active)!;

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
            What Can You Create?
          </h2>
          <p className="text-muted-foreground text-lg">
            Three distinct styles for every mood and skill level
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="relative">
            <div className="rounded-3xl overflow-hidden border-2 border-[#E5E0D5] shadow-lg" style={{ background: '#FFFBF0' }}>
              <Image
                src={activeStyle.image}
                alt={`${activeStyle.name} style coloring page`}
                width={512}
                height={683}
                className="w-full h-auto"
                priority
              />
            </div>
            <div className="flex justify-center gap-3 mt-6">
              {styles.map((style) => (
                <button key={style.id} onClick={() => setActive(style.id)}
                  className={`w-3 h-3 rounded-full transition-all ${active === style.id ? 'scale-125' : 'opacity-40 hover:opacity-70'}`}
                  style={{ backgroundColor: style.color }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {styles.map((style) => (
              <button key={style.id} onClick={() => setActive(style.id)}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                  active === style.id ? 'border-[#FFB800] bg-[#FFF3CC] shadow-md' : 'border-[#E5E0D5] bg-white hover:border-[#FFB800]/30'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: style.color }} />
                  <span className="font-display text-xl text-foreground">{style.name}</span>
                  <span className="text-sm text-muted-foreground">— {style.tagline}</span>
                </div>
                <p className={`text-sm mb-2 ${active === style.id ? 'text-[#4A4A5E]' : 'text-muted-foreground'}`}>{style.description}</p>
                <p className="text-xs text-muted-foreground">Best for: {style.bestFor}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
