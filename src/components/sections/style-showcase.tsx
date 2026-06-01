'use client';

import { useState } from 'react';

const styles = [
  {
    id: 'simple',
    name: 'Simple',
    tagline: 'Bold & Easy',
    description: 'Thick outlines, large areas to color. Perfect for young kids and quick projects.',
    bestFor: 'Ages 3-8, classrooms, party activities',
    color: '#FFB800',
  },
  {
    id: 'mandala',
    name: 'Mandala',
    tagline: 'Relaxing & Symmetrical',
    description: 'Circular symmetrical patterns that bring calm and focus. Great for mindfulness.',
    bestFor: 'Stress relief, adults, meditation',
    color: '#9B59B6',
  },
  {
    id: 'intricate',
    name: 'Intricate',
    tagline: 'Detailed & Immersive',
    description: 'Fine lines, rich scenes with lots of detail. For those who love a coloring challenge.',
    bestFor: 'Adults, artists, KDP sellers',
    color: '#2ECC71',
  },
];

const SimpleSVG = () => (
  <svg viewBox="0 0 300 400" fill="none" className="w-full h-full">
    <rect width="300" height="400" fill="#FFFBF0"/>
    <circle cx="150" cy="130" r="60" stroke="#1A1A2E" strokeWidth="4" fill="none"/>
    <circle cx="130" cy="118" r="10" stroke="#1A1A2E" strokeWidth="3" fill="none"/>
    <circle cx="170" cy="118" r="10" stroke="#1A1A2E" strokeWidth="3" fill="none"/>
    <circle cx="130" cy="118" r="4" fill="#1A1A2E"/>
    <circle cx="170" cy="118" r="4" fill="#1A1A2E"/>
    <path d="M128 148 Q150 170 172 148" stroke="#1A1A2E" strokeWidth="3.5" fill="none"/>
    <ellipse cx="150" cy="300" rx="55" ry="45" stroke="#1A1A2E" strokeWidth="4" fill="none"/>
    <circle cx="132" cy="318" r="14" stroke="#1A1A2E" strokeWidth="3" fill="none"/>
    <circle cx="168" cy="318" r="14" stroke="#1A1A2E" strokeWidth="3" fill="none"/>
    <path d="M50 70 L55 45 L60 70 L80 78 L60 86 L55 110 L50 86 L30 78 Z" stroke="#1A1A2E" strokeWidth="2.5" fill="none"/>
    <circle cx="260" cy="90" r="22" stroke="#1A1A2E" strokeWidth="2.5" fill="none"/>
    <path d="M240 250 L260 230 L280 250" stroke="#1A1A2E" strokeWidth="2.5" fill="none"/>
  </svg>
);

const MandalaSVG = () => (
  <svg viewBox="0 0 300 400" fill="none" className="w-full h-full">
    <rect width="300" height="400" fill="#FFFBF0"/>
    <circle cx="150" cy="200" r="12" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <circle cx="150" cy="200" r="28" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <circle cx="150" cy="200" r="50" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <circle cx="150" cy="200" r="75" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <circle cx="150" cy="200" r="100" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <circle cx="150" cy="200" r="125" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <ellipse cx="150" cy="150" rx="10" ry="22" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <ellipse cx="150" cy="250" rx="10" ry="22" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <ellipse cx="100" cy="200" rx="22" ry="10" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <ellipse cx="200" cy="200" rx="22" ry="10" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <ellipse cx="115" cy="165" rx="10" ry="22" transform="rotate(45 115 165)" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <ellipse cx="185" cy="165" rx="10" ry="22" transform="rotate(-45 185 165)" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <ellipse cx="115" cy="235" rx="10" ry="22" transform="rotate(-45 115 235)" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <ellipse cx="185" cy="235" rx="10" ry="22" transform="rotate(45 185 235)" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <circle cx="150" cy="75" r="6" stroke="#1A1A2E" strokeWidth="1" fill="none"/>
    <circle cx="150" cy="325" r="6" stroke="#1A1A2E" strokeWidth="1" fill="none"/>
    <circle cx="25" cy="200" r="6" stroke="#1A1A2E" strokeWidth="1" fill="none"/>
    <circle cx="275" cy="200" r="6" stroke="#1A1A2E" strokeWidth="1" fill="none"/>
  </svg>
);

const IntricateSVG = () => (
  <svg viewBox="0 0 300 400" fill="none" className="w-full h-full">
    <rect width="300" height="400" fill="#FFFBF0"/>
    <rect x="85" y="150" width="130" height="130" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <rect x="55" y="105" width="40" height="175" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <path d="M55 105 L75 70 L95 105" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <rect x="205" y="105" width="40" height="175" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <path d="M205 105 L225 70 L245 105" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <rect x="125" y="75" width="50" height="75" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <path d="M125 75 L150 40 L175 75" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <rect x="110" y="180" width="15" height="22" rx="7" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <rect x="175" y="180" width="15" height="22" rx="7" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <path d="M140 280 L140 268 A10 10 0 0 1 160 268 L160 280" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <path d="M25 280 L275 280" stroke="#1A1A2E" strokeWidth="1.5"/>
    <path d="M20 40 C20 30 30 20 45 25 C50 15 65 15 70 25 C80 20 88 30 83 40" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <path d="M220 45 C220 35 230 25 245 30 C250 20 262 20 265 30 C275 25 282 35 278 45" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <circle cx="30" cy="250" r="6" stroke="#1A1A2E" strokeWidth="1" fill="none"/>
    <circle cx="260" cy="248" r="7" stroke="#1A1A2E" strokeWidth="1" fill="none"/>
  </svg>
);

const previews: Record<string, () => JSX.Element> = {
  simple: SimpleSVG,
  mandala: MandalaSVG,
  intricate: IntricateSVG,
};

export function StyleShowcase() {
  const [active, setActive] = useState('simple');
  const activeStyle = styles.find(s => s.id === active)!;
  const Preview = previews[active];

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
              <Preview />
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
