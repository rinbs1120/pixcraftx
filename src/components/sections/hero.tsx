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

/* Real transformation demo images */
const demoGroups = [
  {
    id: 'panda',
    product: 'Sticker',
    productColor: '#FF6B6B',
    productBg: '#FFE0E0',
    stages: [
      { src: '/hero/panda-lineart.jpg', alt: 'Line art' },
      { src: '/hero/panda-colored.jpg', alt: 'Colored illustration' },
      { src: '/hero/panda-sticker.png', alt: 'Sticker' },
    ],
  },
  {
    id: 'phoenix',
    product: 'Fridge Magnet',
    productColor: '#FFB800',
    productBg: '#FFF3CC',
    stages: [
      { src: '/hero/phoenix-lineart.jpg', alt: 'Line art' },
      { src: '/hero/phoenix-colored.jpg', alt: 'Colored illustration' },
      { src: '/hero/phoenix-magnet.png', alt: 'Fridge magnet' },
    ],
  },
];

const STAGE_DURATION = 3200;
const TRANSITION_MS = 900;

export function Hero() {
  const [stage, setStage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const advanceStage = useCallback(() => {
    setIsTransitioning(true);
    setStage(prev => (prev + 1) % 3);
    setTimeout(() => setIsTransitioning(false), TRANSITION_MS);
  }, []);

  useEffect(() => {
    const timer = setInterval(advanceStage, STAGE_DURATION);
    return () => clearInterval(timer);
  }, [advanceStage]);

  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      {/* Background decoration */}
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

            {/* How It Works */}
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

          {/* Right: Cinematic transformation showcase — no step indicators, pure visual */}
          <div className="hidden lg:flex lg:justify-center lg:items-center">
            <div className="flex gap-6 items-center">
              {demoGroups.map((group, groupIdx) => (
                <div
                  key={group.id}
                  className="flex flex-col items-center"
                  style={{
                    animation: `heroTransformSlideIn 0.6s ease-out ${0.15 + groupIdx * 0.15}s both, heroFloat 6s ease-in-out ${1 + groupIdx * 0.5}s infinite`,
                  }}
                >
                  {/* Card — 3D perspective + layered shadows for depth */}
                  <div
                    className="relative rounded-2xl overflow-hidden"
                    style={{
                      width: '260px',
                      background: '#FFFFFF',
                      boxShadow: isTransitioning
                        ? `0 0 60px ${group.productColor}18, 0 16px 48px rgba(26,26,46,0.18), 0 4px 12px rgba(26,26,46,0.08)`
                        : '0 12px 40px rgba(26,26,46,0.14), 0 4px 12px rgba(26,26,46,0.08)',
                      transition: 'box-shadow 0.8s ease',
                      transform: 'perspective(800px) rotateY(-3deg)',
                    }}
                  >
                    {/* Image area — 3:4, no overlays or badges */}
                    <div className="relative" style={{ background: '#FFFBF0', aspectRatio: '3/4' }}>
                      {group.stages.map((s, i) => (
                        <Image
                          key={i}
                          src={s.src}
                          alt={s.alt}
                          width={480}
                          height={640}
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{
                            opacity: stage === i ? 1 : 0,
                            transform: stage === i
                              ? 'scale(1)'
                              : `scale(${stage > i ? 0.94 : 1.04})`,
                            filter: stage === i ? 'blur(0px) brightness(1)' : 'blur(6px) brightness(0.92)',
                            transition: `opacity ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1), filter ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                          }}
                          priority={i === 0}
                        />
                      ))}

                      {/* Shimmer sweep during transition only */}
                      {isTransitioning && (
                        <div
                          className="absolute inset-0 pointer-events-none z-10"
                          style={{
                            background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.4) 55%, transparent 70%)',
                            animation: 'heroShimmer 1s ease-out forwards',
                          }}
                        />
                      )}

                      {/* Inner shadow for 3D depth */}
                      <div
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{ boxShadow: 'inset 0 0 30px rgba(26,26,46,0.06)' }}
                      />
                    </div>

                    {/* Bottom accent line — product color hint */}
                    <div
                      className="h-[3px] w-full transition-colors duration-700"
                      style={{ background: `linear-gradient(90deg, transparent, ${group.productColor}40, transparent)` }}
                    />
                  </div>

                  {/* Product label — rounded-full pill, only product name */}
                  <div
                    className="mt-3.5 px-5 py-2 rounded-full text-center"
                    style={{
                      background: group.productBg,
                      boxShadow: `0 2px 8px ${group.productColor}20`,
                    }}
                  >
                    <span className="font-display text-sm" style={{ color: group.productColor }}>
                      {group.product}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
