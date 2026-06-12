'use client';

import { useState, useEffect } from 'react';
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
    name: 'Panda',
    product: 'Sticker',
    stages: [
      { src: '/hero/panda-lineart.jpg', label: 'Line Art' },
      { src: '/hero/panda-colored.jpg', label: 'Pop Art' },
      { src: '/hero/panda-sticker.png', label: 'Sticker' },
    ],
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    product: 'Magnet',
    stages: [
      { src: '/hero/phoenix-lineart.jpg', label: 'Line Art' },
      { src: '/hero/phoenix-colored.jpg', label: 'Vivid' },
      { src: '/hero/phoenix-magnet.png', label: 'Fridge Magnet' },
    ],
  },
];

const STAGE_DURATION = 3000;

export function Hero() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStage(prev => (prev + 1) % 3);
    }, STAGE_DURATION);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      {/* Background decoration - consistent with site */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.12] pointer-events-none" style={{ background: 'radial-gradient(circle, #FFB800 0%, transparent 70%)' }} />

      <div className="container mx-auto px-4 md:px-6 max-w-[1440px]">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text Content - unchanged */}
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

          {/* Right: Two transformation demo cards */}
          <div className="hidden lg:flex lg:justify-center lg:items-center">
            <div className="flex gap-5 items-end">
              {demoGroups.map((group, groupIdx) => (
                <div
                  key={group.id}
                  className="flex flex-col items-center"
                  style={{
                    animation: `heroTransformSlideIn 0.6s ease-out ${0.15 + groupIdx * 0.15}s both`,
                  }}
                >
                  {/* Card - same style as site cards */}
                  <div
                    className="relative rounded-2xl overflow-hidden bg-white transition-shadow duration-300 hover:shadow-2xl"
                    style={{
                      width: groupIdx === 0 ? '270px' : '250px',
                      boxShadow: '0 8px 24px rgba(26,26,46,0.1)',
                    }}
                  >
                    {/* Image area */}
                    <div className="relative" style={{ background: '#FFFBF0', aspectRatio: '3/4' }}>
                      {group.stages.map((s, i) => (
                        <Image
                          key={i}
                          src={s.src}
                          alt={`${group.name} ${s.label}`}
                          width={480}
                          height={640}
                          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out"
                          style={{ opacity: stage === i ? 1 : 0 }}
                          priority={i === 0}
                        />
                      ))}

                      {/* Stage badge - matches site badge style (rounded-full, brand colors) */}
                      <div
                        className="absolute top-3 left-3 transition-all duration-500"
                      >
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-[#1A1A2E]"
                          style={{
                            backgroundColor: stage === 0
                              ? '#FFFFFF'
                              : stage === 1
                              ? '#FFF3CC'
                              : '#FFE0E0',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          }}
                        >
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold"
                            style={{
                              backgroundColor: stage === 0
                                ? '#1A1A2E'
                                : stage === 1
                                ? '#FFB800'
                                : '#FF6B6B',
                            }}
                          >
                            {stage + 1}
                          </span>
                          {group.stages[stage].label}
                        </span>
                      </div>
                    </div>

                    {/* Bottom progress bar - uses brand colors */}
                    <div className="px-3 py-2 bg-white">
                      <div className="flex gap-1.5">
                        {group.stages.map((s, i) => (
                          <div
                            key={i}
                            className="h-1.5 rounded-full flex-1 transition-all duration-500"
                            style={{
                              backgroundColor: stage >= i
                                ? (i === 0 ? '#1A1A2E' : i === 1 ? '#FFB800' : '#FF6B6B')
                                : '#E5E0D5',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card label below - matches site label style */}
                  <div
                    className="mt-3 px-4 py-2 rounded-xl border-2 text-center"
                    style={{
                      borderColor: groupIdx === 0 ? '#FF6B6B' : '#FFB800',
                      background: groupIdx === 0 ? '#FFE0E0' : '#FFF3CC',
                    }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: groupIdx === 0 ? '#FF6B6B' : '#FFB800' }}
                      />
                      <span className="font-display text-sm text-foreground">{group.name}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">→ {group.product}</p>
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
