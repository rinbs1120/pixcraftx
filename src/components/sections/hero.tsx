'use client';

import Link from 'next/link';
import { Sparkles, Check } from 'lucide-react';

// SVG Card Components
const DinosaurSVG = () => (
  <svg viewBox="0 0 220 290" fill="none" role="img" aria-label="Dinosaur coloring page with partial coloring" className="w-full h-full">
    <rect width="220" height="290" fill="#FFFDF5"/>
    <path d="M60 200 C60 160, 80 130, 100 120 C110 115, 120 118, 125 125 C130 118, 145 115, 155 125 C170 140, 170 170, 160 190 L160 230 C160 240, 150 250, 140 250 L130 250 L130 240 L115 240 L115 250 L100 250 C90 250, 85 240, 85 230 L85 200 Z" stroke="#1A1A2E" strokeWidth="2.5" fill="none"/>
    <path d="M60 200 C60 165, 78 135, 98 125 C105 122, 112 123, 118 128 L100 200 L85 200 Z" fill="#2ECC71" opacity="0.4"/>
    <circle cx="115" cy="132" r="4" fill="#1A1A2E"/>
    <circle cx="116" cy="131" r="1.5" fill="#FFF"/>
    <path d="M100 120 L95 105 L105 115" stroke="#1A1A2E" strokeWidth="2" fill="none"/>
    <path d="M110 116 L108 98 L117 112" stroke="#1A1A2E" strokeWidth="2" fill="none"/>
    <path d="M125 118 L127 100 L132 116" stroke="#1A1A2E" strokeWidth="2" fill="none"/>
    <path d="M30 255 L190 255" stroke="#1A1A2E" strokeWidth="1.5"/>
    <path d="M45 255 C45 240, 55 235, 50 255 M50 255 C50 238, 60 232, 55 255" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <circle cx="175" cy="55" r="18" stroke="#1A1A2E" strokeWidth="2" fill="none"/>
    <line x1="175" y1="28" x2="175" y2="22" stroke="#1A1A2E" strokeWidth="1.5"/>
    <line x1="175" y1="82" x2="175" y2="88" stroke="#1A1A2E" strokeWidth="1.5"/>
    <line x1="148" y1="55" x2="142" y2="55" stroke="#1A1A2E" strokeWidth="1.5"/>
    <line x1="202" y1="55" x2="208" y2="55" stroke="#1A1A2E" strokeWidth="1.5"/>
  </svg>
);

const UnicornSVG = () => (
  <svg viewBox="0 0 240 310" fill="none" role="img" aria-label="Unicorn line art coloring page" className="w-full h-full">
    <rect width="240" height="310" fill="#FFFCF5"/>
    <ellipse cx="120" cy="160" rx="45" ry="55" stroke="#1A1A2E" strokeWidth="2.5" fill="none"/>
    <path d="M120 105 L125 60 L130 105" stroke="#1A1A2E" strokeWidth="2.5" fill="none"/>
    <line x1="123" y1="75" x2="128" y2="75" stroke="#1A1A2E" strokeWidth="1.5"/>
    <line x1="122" y1="88" x2="129" y2="88" stroke="#1A1A2E" strokeWidth="1.5"/>
    <path d="M95 115 L88 95 L105 110" stroke="#1A1A2E" strokeWidth="2" fill="none"/>
    <ellipse cx="105" cy="150" rx="6" ry="7" fill="#1A1A2E"/>
    <ellipse cx="107" cy="148" rx="2" ry="2.5" fill="#FFF"/>
    <path d="M150 120 C165 130, 170 150, 160 165 C155 175, 165 185, 155 200 C148 210, 160 220, 150 235" stroke="#1A1A2E" strokeWidth="2.5" fill="none"/>
    <path d="M145 115 C158 122, 162 140, 155 155 C150 165, 158 175, 148 190" stroke="#1A1A2E" strokeWidth="2" fill="none"/>
    <path d="M90 200 C85 230, 80 260, 75 285" stroke="#1A1A2E" strokeWidth="2.5" fill="none"/>
    <path d="M130 200 C135 230, 140 260, 145 285" stroke="#1A1A2E" strokeWidth="2.5" fill="none"/>
    <path d="M30 50 L33 43 L36 50 L43 53 L36 56 L33 63 L30 56 L23 53 Z" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <path d="M190 80 L192 75 L194 80 L199 82 L194 84 L192 89 L190 84 L185 82 Z" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <circle cx="50" cy="100" r="3" stroke="#1A1A2E" strokeWidth="1" fill="none"/>
    <circle cx="200" cy="140" r="4" stroke="#1A1A2E" strokeWidth="1" fill="none"/>
  </svg>
);

const MandalaSVG = () => (
  <svg viewBox="0 0 220 290" fill="none" role="img" aria-label="Mandala line art coloring page" className="w-full h-full">
    <rect width="220" height="290" fill="#FFFDF8"/>
    <circle cx="110" cy="145" r="15" stroke="#1A1A2E" strokeWidth="2" fill="none"/>
    <circle cx="110" cy="145" r="8" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <ellipse cx="110" cy="115" rx="10" ry="18" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <ellipse cx="110" cy="175" rx="10" ry="18" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <ellipse cx="80" cy="145" rx="18" ry="10" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <ellipse cx="140" cy="145" rx="18" ry="10" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <ellipse cx="88" cy="117" rx="10" ry="16" stroke="#1A1A2E" strokeWidth="1.5" fill="none" transform="rotate(45 88 117)"/>
    <ellipse cx="132" cy="173" rx="10" ry="16" stroke="#1A1A2E" strokeWidth="1.5" fill="none" transform="rotate(45 132 173)"/>
    <ellipse cx="132" cy="117" rx="10" ry="16" stroke="#1A1A2E" strokeWidth="1.5" fill="none" transform="rotate(-45 132 117)"/>
    <ellipse cx="88" cy="173" rx="10" ry="16" stroke="#1A1A2E" strokeWidth="1.5" fill="none" transform="rotate(-45 88 173)"/>
    <circle cx="110" cy="145" r="45" stroke="#1A1A2E" strokeWidth="2" fill="none"/>
    <circle cx="110" cy="145" r="70" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <circle cx="110" cy="75" r="5" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <circle cx="110" cy="215" r="5" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <circle cx="40" cy="145" r="5" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <circle cx="180" cy="145" r="5" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <circle cx="60" cy="95" r="5" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <circle cx="160" cy="195" r="5" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <circle cx="160" cy="95" r="5" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <circle cx="60" cy="195" r="5" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
    <circle cx="110" cy="145" r="95" stroke="#1A1A2E" strokeWidth="1.5" fill="none"/>
  </svg>
);

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
      {/* Radial gradient decoration behind title */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.12] pointer-events-none" style={{ background: 'radial-gradient(circle, #FFB800 0%, transparent 70%)' }} />
      
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text Content */}
          <div className="text-center lg:text-left">
            <h1 className="font-display text-4xl md:text-5xl lg:text-[56px] text-foreground leading-tight mb-6">
              Create Any Coloring Page in Seconds
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              Describe your idea or upload a photo — get print-ready coloring pages in seconds.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Link
                href="/generate"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-lg rounded-full transition-all hover:-translate-y-1 text-[#1A1A2E]"
                style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)', boxShadow: '0 4px 16px rgba(255,107,107,0.3)' }}
              >
                <Sparkles className="w-5 h-5" />
                Start Creating — Free
              </Link>
            </div>
            
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#2ECC71]" />
                No credit card
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#2ECC71]" />
                5 free pages
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#2ECC71]" />
                Ready to print
              </span>
            </div>
          </div>
          
          {/* Right: Hero Cards */}
          <div className="relative h-[400px] lg:h-[480px] hidden lg:block">
            {/* Card 1: Dinosaur */}
            <div 
              className="absolute w-[200px] rounded-2xl overflow-hidden bg-white transition-all duration-300 hover:rotate-0 hover:-translate-y-2"
              style={{ 
                left: '10px', 
                top: '40px', 
                transform: 'rotate(-3deg)',
                boxShadow: '0 8px 24px rgba(26,26,46,0.12)'
              }}
            >
              <div className="p-3">
                <DinosaurSVG />
              </div>
              <div className="px-3 pb-3 text-center">
                <span className="text-xs font-medium text-muted-foreground">Dinosaur — coloring</span>
              </div>
            </div>
            
            {/* Card 2: Unicorn (center, larger) */}
            <div 
              className="absolute w-[240px] rounded-2xl overflow-hidden bg-white transition-all duration-300 hover:rotate-0 hover:-translate-y-2"
              style={{ 
                left: '50%', 
                top: '10px', 
                transform: 'translateX(-50%) rotate(0deg)',
                boxShadow: '0 12px 32px rgba(26,26,46,0.15)'
              }}
            >
              <div className="p-3">
                <UnicornSVG />
              </div>
              <div className="px-3 pb-3 text-center">
                <span className="text-xs font-medium text-muted-foreground">Unicorn — line art</span>
              </div>
            </div>
            
            {/* Card 3: Mandala */}
            <div 
              className="absolute w-[200px] rounded-2xl overflow-hidden bg-white transition-all duration-300 hover:rotate-0 hover:-translate-y-2"
              style={{ 
                right: '10px', 
                top: '60px', 
                transform: 'rotate(3deg)',
                boxShadow: '0 8px 24px rgba(26,26,46,0.12)'
              }}
            >
              <div className="p-3">
                <MandalaSVG />
              </div>
              <div className="px-3 pb-3 text-center">
                <span className="text-xs font-medium text-muted-foreground">Mandala — line art</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
