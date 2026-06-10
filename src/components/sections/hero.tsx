'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Check, Pencil, Upload, Palette, Printer, ArrowRight } from 'lucide-react';

const styles = [
  {
    id: 'simple',
    name: 'Simple',
    tagline: 'Bold & Easy',
    description: 'Perfect for young kids',
    color: '#FFB800',
    overlayGradient: 'linear-gradient(135deg, rgba(255,184,0,0.25) 0%, rgba(255,107,107,0.15) 100%)',
    brushColor: '#FFB800',
    image: '/styles/simple.jpg',
    delay: '0s',
  },
  {
    id: 'mandala',
    name: 'Mandala',
    tagline: 'Relaxing & Symmetrical',
    description: 'Great for mindfulness',
    color: '#9B59B6',
    overlayGradient: 'linear-gradient(135deg, rgba(155,89,182,0.25) 0%, rgba(52,152,219,0.15) 100%)',
    brushColor: '#9B59B6',
    image: '/styles/mandala.jpg',
    delay: '2s',
  },
  {
    id: 'intricate',
    name: 'Intricate',
    tagline: 'Detailed & Immersive',
    description: 'For coloring enthusiasts',
    color: '#2ECC71',
    overlayGradient: 'linear-gradient(135deg, rgba(46,204,113,0.25) 0%, rgba(255,184,0,0.15) 100%)',
    brushColor: '#2ECC71',
    image: '/styles/intricate.jpg',
    delay: '4s',
  },
];

const steps = [
  {
    number: 1,
    title: 'Describe or Upload',
    description: 'Type what you want, or upload a reference photo',
    icon: Pencil,
  },
  {
    number: 2,
    title: 'Choose Line Style',
    description: 'Pick Simple, Mandala, or Intricate line art',
    icon: Sparkles,
  },
  {
    number: 3,
    title: 'Generate',
    description: 'AI creates a clean, printable line art',
    icon: Sparkles,
  },
  {
    number: 4,
    title: 'Auto Color & Style',
    description: 'Auto-color it, or transform with 5 art styles',
    icon: Palette,
  },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      {/* Radial gradient decoration */}
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
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-sm text-muted-foreground mb-10">
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#2ECC71]" />
                No credit card
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#2ECC71]" />
                2 free credits
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#2ECC71]" />
                Ready to print
              </span>
            </div>

            {/* How It Works - Inline Steps */}
            <div className="border-t border-border/50 pt-8">
              <h3 className="font-display text-lg text-foreground mb-5">How It Works</h3>
              <div className="grid grid-cols-2 gap-4">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.number} className="flex gap-3 items-start">
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)' }}
                        >
                          <Icon className="w-5 h-5 text-[#1A1A2E]" />
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1A1A2E] text-white text-[10px] font-bold flex items-center justify-center">
                          {step.number}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground">{step.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Style Cards with coloring animation */}
          <div className="hidden lg:flex lg:gap-5 lg:justify-center lg:items-end">
            {styles.map((style, index) => (
              <div
                key={style.id}
                className="flex flex-col items-center group"
                style={{
                  animation: `heroCardSlideIn 0.6s ease-out ${0.2 + index * 0.15}s both`,
                }}
              >
                {/* Image Card */}
                <Link
                  href={`/generate?style=${style.id}`}
                  className="block relative rounded-2xl overflow-hidden bg-white transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                  style={{
                    width: '190px',
                    boxShadow: '0 8px 24px rgba(26,26,46,0.1)',
                  }}
                >
                  {/* Line art image */}
                  <div className="relative" style={{ background: '#FFFBF0' }}>
                    <Image
                      src={style.image}
                      alt={`${style.name} style coloring page`}
                      width={400}
                      height={533}
                      className="w-full h-auto"
                      priority
                    />
                    {/* Coloring overlay - brush stroke reveal animation */}
                    <div
                      className="absolute inset-0 coloring-brush-reveal"
                      style={{
                        background: style.overlayGradient,
                        mixBlendMode: 'multiply',
                        animationDelay: style.delay,
                      }}
                    />
                    {/* Brush stroke edge effect */}
                    <div
                      className="absolute top-0 bottom-0 left-0 brush-stroke-edge"
                      style={{
                        width: '3px',
                        background: style.brushColor,
                        opacity: 0,
                        animationDelay: style.delay,
                      }}
                    />
                  </div>
                  {/* Bottom color dots */}
                  <div className="flex justify-center gap-1.5 py-2.5 bg-white">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FF6B6B' }} />
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FFB800' }} />
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2ECC71' }} />
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#9B59B6' }} />
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3498DB' }} />
                  </div>
                </Link>

                {/* Style Label */}
                <div
                  className="mt-3 px-4 py-2 rounded-xl border-2 text-center transition-all duration-300 group-hover:shadow-md"
                  style={{
                    borderColor: style.color,
                    background: `${style.color}10`,
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: style.color }} />
                    <span className="font-display text-sm text-foreground">{style.name}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{style.tagline}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
