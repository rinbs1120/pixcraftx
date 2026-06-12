'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Check, Pencil, Palette } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Describe or Upload',
    description: 'Type what you want, or upload a reference photo',
    icon: Pencil,
  },
  {
    number: 2,
    title: 'Generate Line Art',
    description: 'AI creates a clean line art from your idea',
    icon: Sparkles,
  },
  {
    number: 3,
    title: 'Color & Style',
    description: 'Apply colors and art styles with one click',
    icon: Sparkles,
  },
  {
    number: 4,
    title: 'Turn into Merch',
    description: 'Make fridge magnets, stickers, or canvas prints',
    icon: Palette,
  },
];

const STAGE_DURATION = 3000;
const stageConfig = [
  { label: 'Line Art', color: '#1A1A2E', icon: '✏️' },
  { label: 'Color & Style', color: '#FFB800', icon: '🎨' },
  { label: 'Fridge Magnet', color: '#FF6B6B', icon: '🧲' },
];

export function Hero() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStage(prev => (prev + 1) % 3);
    }, STAGE_DURATION);
    return () => clearInterval(timer);
  }, []);

  const goToStage = useCallback((s: number) => {
    setStage(s);
  }, []);

  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      {/* Radial gradient decoration */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.12] pointer-events-none" style={{ background: 'radial-gradient(circle, #FFB800 0%, transparent 70%)' }} />

      <div className="container mx-auto px-4 md:px-6 max-w-[1440px]">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text Content */}
          <div className="text-center lg:text-left">
            <h1 className="font-display text-4xl md:text-5xl lg:text-[56px] text-foreground leading-tight mb-6">
              Color It, Then Make It Yours
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              Generate stunning line art, color it with AI styles, then turn it into fridge magnets, stickers, and canvas prints.
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
                {steps.map((step) => {
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

          {/* Right: Animated Transformation Display */}
          <div className="hidden lg:flex lg:justify-center lg:items-center">
            <div className="flex flex-col items-center">
              {/* Main transformation card */}
              <div className="relative hero-transform-slide-in">
                <div className="relative animate-hero-float">
                  <Link
                    href="/generate"
                    className="block relative rounded-2xl overflow-hidden bg-white transition-all duration-700 ease-in-out"
                    style={{
                      width: '360px',
                      boxShadow: stage === 2
                        ? '0 16px 48px rgba(26,26,46,0.25), 0 4px 12px rgba(255,107,107,0.15)'
                        : '0 8px 24px rgba(26,26,46,0.1)',
                    }}
                  >
                    {/* Image container */}
                    <div className="relative" style={{ background: '#FFFBF0' }}>
                      <Image
                        src="/styles/simple.jpg"
                        alt="Coloring page transformation demo"
                        width={512}
                        height={683}
                        className="w-full h-auto"
                        priority
                      />

                      {/* Stage 1+: Color overlay with sweep animation */}
                      <div
                        className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,107,107,0.4) 0%, rgba(255,184,0,0.35) 30%, rgba(46,204,113,0.35) 60%, rgba(52,152,219,0.35) 100%)',
                          mixBlendMode: 'multiply',
                          opacity: stage >= 1 ? 1 : 0,
                        }}
                      />

                      {/* Color sweep shine effect - appears when transitioning to stage 1 */}
                      {stage >= 1 && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
                            animation: 'colorSweep 1.5s ease-out forwards',
                          }}
                        />
                      )}

                      {/* Stage 2: Fridge magnet white border frame */}
                      <div
                        className="absolute inset-0 pointer-events-none transition-all duration-700 ease-in-out"
                        style={{
                          border: stage === 2 ? '14px solid white' : '0px solid white',
                          borderRadius: stage === 2 ? '4px' : '16px',
                          boxShadow: stage === 2 ? 'inset 0 2px 12px rgba(0,0,0,0.12)' : 'none',
                        }}
                      />
                    </div>

                    {/* Stage 2: Magnet icon at top */}
                    <div
                      className="absolute left-1/2 transition-all duration-700 ease-in-out"
                      style={{
                        top: stage === 2 ? '-6px' : '-26px',
                        opacity: stage === 2 ? 1 : 0,
                        transform: 'translateX(-50%)',
                        zIndex: 10,
                      }}
                    >
                      <div className="relative">
                        <div className="w-10 h-5 rounded-t-full bg-gradient-to-b from-red-400 to-red-500 shadow-md" />
                        <div className="w-10 h-[3px] bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 rounded-full" />
                      </div>
                    </div>

                    {/* Stage 2: Subtle fridge background hint */}
                    <div
                      className="absolute inset-0 pointer-events-none transition-opacity duration-700"
                      style={{
                        background: 'radial-gradient(ellipse at center top, rgba(200,210,220,0.08) 0%, transparent 70%)',
                        opacity: stage === 2 ? 1 : 0,
                      }}
                    />
                  </Link>
                </div>

                {/* Stage badge floating on the right */}
                <div
                  className="absolute -right-3 top-12 px-3 py-1.5 rounded-full text-white text-xs font-bold shadow-lg transition-all duration-500 ease-in-out flex items-center gap-1.5"
                  style={{
                    backgroundColor: stageConfig[stage].color,
                    transform: stage === 2 ? 'translateX(6px)' : 'translateX(0)',
                  }}
                >
                  <span className="text-sm">{stageConfig[stage].icon}</span>
                  {stageConfig[stage].label}
                </div>

                {/* Decorative sparkles for stage 1+ */}
                {stage >= 1 && (
                  <div className="absolute -top-2 -left-2 pointer-events-none">
                    <Sparkles className="w-5 h-5 text-[#FFB800] animate-sparkle" />
                  </div>
                )}
              </div>

              {/* Stage indicators */}
              <div className="mt-6 flex items-center gap-6">
                {stageConfig.map((s, i) => (
                  <button
                    key={s.label}
                    onClick={() => goToStage(i)}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: stage === i ? '12px' : '8px',
                        height: stage === i ? '12px' : '8px',
                        backgroundColor: stage === i ? s.color : '#D1D5DB',
                        boxShadow: stage === i ? `0 0 8px ${s.color}40` : 'none',
                      }}
                    />
                    <span
                      className="text-[11px] transition-all duration-300 whitespace-nowrap"
                      style={{
                        color: stage === i ? s.color : '#9CA3AF',
                        fontWeight: stage === i ? 700 : 400,
                      }}
                    >
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
