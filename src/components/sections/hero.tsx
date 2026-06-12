'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Check, Pencil, Palette } from 'lucide-react';

const stepsData = [
  { number: 1, title: 'Describe or Upload', description: 'Type what you want, or upload a reference photo', icon: Pencil },
  { number: 2, title: 'Generate Line Art', description: 'AI creates a clean line art from your idea', icon: Sparkles },
  { number: 3, title: 'Color & Style', description: 'Apply colors and art styles with one click', icon: Sparkles },
  { number: 4, title: 'Turn into Merch', description: 'Make fridge magnets, stickers, or canvas prints', icon: Palette },
];

const demoFlows = [
  {
    id: 'panda',
    product: 'Sticker',
    productColor: '#FF6B6B',
    promptWords: ['Cute', 'panda', 'eating', 'bamboo'],
    styleName: 'Pop Art',
    images: {
      lineart: '/hero/panda-lineart.jpg',
      colored: '/hero/panda-colored.jpg',
      product: '/hero/panda-sticker.png',
    },
  },
  {
    id: 'phoenix',
    product: 'Fridge Magnet',
    productColor: '#FFB800',
    promptWords: ['Phoenix', 'rising', 'over', 'volcano'],
    styleName: 'Vivid',
    images: {
      lineart: '/hero/phoenix-lineart.jpg',
      colored: '/hero/phoenix-colored.jpg',
      product: '/hero/phoenix-magnet.png',
    },
  },
];

const STEP_COUNT = 4;
const STEP_DURATIONS = [3200, 2800, 2800, 4500];
const WORD_TYPING_INTERVAL = 450;

/* Dark theme colors */
const dark = {
  bg: '#1A1A2E',
  surface: '#242438',
  surfaceLight: '#2E2E48',
  border: '#3A3A54',
  text: '#E8E4F0',
  textMuted: '#9894A8',
  accent: '#FFB800',
  accentSecondary: '#FF6B6B',
};

export function Hero() {
  const [phase, setPhase] = useState(0);
  const [visibleWords, setVisibleWords] = useState(0);

  const totalPhases = demoFlows.length * STEP_COUNT;
  const demoIdx = Math.floor(phase / STEP_COUNT) % demoFlows.length;
  const stepIdx = phase % STEP_COUNT;
  const demo = demoFlows[demoIdx];
  const is3D = stepIdx === 3;

  // Mechanical typing
  useEffect(() => {
    if (stepIdx === 0) {
      setVisibleWords(0);
      const timers: NodeJS.Timeout[] = [];
      demo.promptWords.forEach((_, i) => {
        timers.push(setTimeout(() => setVisibleWords(i + 1), 600 + i * WORD_TYPING_INTERVAL));
      });
      return () => timers.forEach(clearTimeout);
    }
  }, [stepIdx, demo.promptWords]);

  // Auto-advance
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase(prev => (prev + 1) % totalPhases);
    }, STEP_DURATIONS[stepIdx]);
    return () => clearTimeout(timer);
  }, [phase, stepIdx, totalPhases]);

  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.12] pointer-events-none" style={{ background: 'radial-gradient(circle, #FFB800 0%, transparent 70%)' }} />

      <div className="container mx-auto px-4 md:px-6 max-w-[1440px]">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <div className="text-center lg:text-left">
            <h1 className="font-display text-4xl md:text-5xl lg:text-[56px] text-foreground leading-tight mb-6">Color It, Then Make It Yours</h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">Generate stunning line art, color it with AI styles, then turn it into fridge magnets, stickers, and canvas prints.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Link href="/generate" className="inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-lg rounded-full transition-all hover:-translate-y-1 text-[#1A1A2E]" style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)', boxShadow: '0 4px 16px rgba(255,107,107,0.3)' }}>
                <Sparkles className="w-5 h-5" />Start Creating — Free
              </Link>
            </div>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-sm text-muted-foreground mb-10">
              <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-[#2ECC71]" />No credit card</span>
              <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-[#2ECC71]" />2 free credits</span>
              <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-[#2ECC71]" />Ready to print</span>
            </div>
            <div className="border-t border-border/50 pt-8">
              <h3 className="font-display text-lg text-foreground mb-5">How It Works</h3>
              <div className="grid grid-cols-2 gap-4">
                {stepsData.map((step) => { const Icon = step.icon; return (
                  <div key={step.number} className="flex gap-3 items-start">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)' }}><Icon className="w-5 h-5 text-[#1A1A2E]" /></div>
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1A1A2E] text-white text-[10px] font-bold flex items-center justify-center">{step.number}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground">{step.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    </div>
                  </div>
                ); })}
              </div>
            </div>
          </div>

          {/* Right: Mini App Demo — Dark theme, larger */}
          <div className="hidden lg:flex lg:justify-center lg:items-center">
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                width: '540px',
                background: dark.bg,
                boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.15)',
                animation: 'heroTransformSlideIn 0.8s ease-out both',
              }}
            >
              {/* Window top bar — dark */}
              <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ background: dark.surface, borderColor: dark.border }}>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#FF5F57' }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: '#FEBC2E' }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: '#28C840' }} />
                </div>
                <span className="font-display text-xs ml-3" style={{ color: dark.textMuted }}>PixCraftX</span>
                <div className="ml-auto flex gap-2">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="rounded-full transition-all duration-500" style={{
                      width: stepIdx===i ? '24px' : '8px',
                      height: '8px',
                      background: stepIdx>=i
                        ? (i===0 ? '#1A1A2E' : i===1 ? '#FFB800' : i===2 ? '#FF6B6B' : '#2ECC71')
                        : dark.surfaceLight,
                    }} />
                  ))}
                </div>
              </div>

              {/* Content area */}
              <div className="relative" style={{ minHeight: '420px' }}>

                {/* STEP 0: Generate */}
                <div className="absolute inset-0 flex flex-col transition-all duration-700" style={{ opacity: stepIdx===0?1:0, transform: stepIdx===0?'translateX(0)':'translateX(-40px)', pointerEvents: stepIdx===0?'auto':'none' }}>
                  <div className="px-5 pt-5 pb-3">
                    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: dark.surfaceLight, border: `1px solid ${dark.border}`, minHeight: '40px' }}>
                      <span style={{ color: dark.accent }} className="mr-2">✨</span>
                      {demo.promptWords.map((word, i) => (
                        <span key={i} className="inline transition-all duration-200" style={{ opacity: i < visibleWords ? 1 : 0, color: dark.text }}>
                          {word}{i < demo.promptWords.length - 1 ? ' ' : ''}
                        </span>
                      ))}
                      <span className="inline-block w-[2px] h-4 ml-0.5 align-middle" style={{ background: dark.accent, animation: 'heroBlink 0.8s step-end infinite' }} />
                    </div>
                    <button className="mt-3 px-4 py-2 rounded-lg text-xs font-bold text-[#1A1A2E]" style={{ background: 'linear-gradient(135deg, #FFB800, #FF6B6B)' }}>Generate Line Art</button>
                  </div>
                  <div className="flex-1 px-5 pb-5">
                    <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '3/4', background: dark.surfaceLight, maxHeight: '300px' }}>
                      <Image src={demo.images.lineart} alt="Generated line art" width={480} height={640} className="w-full h-full object-cover" style={{ opacity: stepIdx===0?1:0, animation: stepIdx===0?'heroFadeIn 0.8s ease-out 2.2s both':'none' }} />
                    </div>
                  </div>
                </div>

                {/* STEP 1: Color & Style */}
                <div className="absolute inset-0 flex transition-all duration-700" style={{ opacity: stepIdx===1?1:0, transform: stepIdx===1?'translateX(0)':stepIdx<1?'translateX(40px)':'translateX(-40px)', pointerEvents: stepIdx===1?'auto':'none' }}>
                  <div className="w-[170px] p-4 border-r" style={{ background: dark.surface, borderColor: dark.border }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: dark.textMuted }}>Art Style</p>
                    {['Pastel', demo.styleName, 'Muted'].map((name) => {
                      const sel = name === demo.styleName;
                      return (
                        <div key={name} className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1.5 text-xs" style={{
                          background: sel ? `${dark.accent}15` : 'transparent',
                          border: sel ? `1.5px solid ${dark.accent}` : `1.5px solid transparent`,
                          fontWeight: sel ? 700 : 400,
                          color: sel ? dark.accent : dark.textMuted,
                        }}>
                          <div className="w-3.5 h-3.5 rounded-full" style={{ background: name==='Pastel'?'#FFD1DC':name===demo.styleName?'#FF6B6B':'#A8B5A0' }} />
                          {name}
                        </div>
                      );
                    })}
                    <button className="mt-3 w-full px-3 py-2 rounded-lg text-[11px] font-bold text-[#1A1A2E]" style={{ background: 'linear-gradient(135deg, #FFB800, #FF6B6B)' }}>Color It!</button>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '3/4', background: dark.surfaceLight, maxHeight: '360px' }}>
                      <Image src={demo.images.lineart} alt="Line art" width={480} height={640} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000" style={{ opacity: 0 }} />
                      <Image src={demo.images.colored} alt="Colored" width={480} height={640} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000" style={{ opacity: 1 }} />
                    </div>
                  </div>
                </div>

                {/* STEP 2: Product */}
                <div className="absolute inset-0 flex transition-all duration-700" style={{ opacity: stepIdx===2?1:0, transform: stepIdx===2?'translateX(0)':stepIdx<2?'translateX(40px)':'translateX(-40px)', pointerEvents: stepIdx===2?'auto':'none' }}>
                  <div className="w-[170px] p-4 border-r" style={{ background: dark.surface, borderColor: dark.border }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: dark.textMuted }}>Product</p>
                    {[
                      { name: 'Canvas Print', bg: '#4A4A64' },
                      { name: demo.product, bg: demo.productColor },
                      { name: demo.id==='panda'?'Fridge Magnet':'Sticker', bg: '#4A4A64' },
                    ].map((p) => {
                      const sel = p.name === demo.product;
                      return (
                        <div key={p.name} className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1.5 text-xs" style={{
                          background: sel ? `${demo.productColor}18` : 'transparent',
                          border: sel ? `1.5px solid ${demo.productColor}` : `1.5px solid transparent`,
                          fontWeight: sel ? 700 : 400,
                          color: sel ? demo.productColor : dark.textMuted,
                        }}>
                          <div className="w-3.5 h-3.5 rounded" style={{ background: p.bg }} />
                          {p.name}
                        </div>
                      );
                    })}
                    <button className="mt-3 w-full px-3 py-2 rounded-lg text-[11px] font-bold text-[#1A1A2E]" style={{ background: 'linear-gradient(135deg, #FFB800, #FF6B6B)' }}>Create Product</button>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '3/4', background: dark.surfaceLight, maxHeight: '360px' }}>
                      <Image src={demo.images.product} alt={demo.product} width={480} height={640} className="absolute inset-0 w-full h-full object-contain" style={{ opacity: 1 }} />
                    </div>
                  </div>
                </div>

                {/* STEP 3: 3D Showcase — dark stage, transparent product, real 3D rotation */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-700"
                  style={{
                    opacity: stepIdx===3 ? 1 : 0,
                    transform: stepIdx===3 ? 'translateX(0) scale(1)' : 'translateX(40px) scale(0.95)',
                    pointerEvents: stepIdx===3 ? 'auto' : 'none',
                    background: `radial-gradient(ellipse at 50% 40%, ${dark.surfaceLight} 0%, ${dark.bg} 70%)`,
                  }}
                >
                  {/* Spotlight effect */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] pointer-events-none" style={{ background: `radial-gradient(ellipse, ${demo.productColor}08 0%, transparent 70%)` }} />

                  {/* Reflection surface */}
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[220px] h-[20px] rounded-full pointer-events-none" style={{ background: `radial-gradient(ellipse, ${demo.productColor}20 0%, transparent 70%)`, filter: 'blur(10px)' }} />

                  {/* 3D rotating product */}
                  <div className="hero-3d-stage" style={{ perspective: '1200px' }}>
                    <div
                      className="hero-3d-spinner"
                      style={{
                        transformStyle: 'preserve-3d',
                        animation: 'hero3DRotate 4s ease-in-out infinite',
                      }}
                    >
                      <Image
                        src={demo.images.product}
                        alt={demo.product}
                        width={480}
                        height={640}
                        style={{
                          width: '200px',
                          height: 'auto',
                          filter: `drop-shadow(0 12px 32px rgba(0,0,0,0.35)) drop-shadow(0 4px 12px ${demo.productColor}30)`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="flex gap-3 mt-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-[#2ECC71]" style={{ background: '#2ECC7118', border: '1px solid #2ECC7130' }}>✓ BG Removed</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-[#1A1A2E]" style={{ background: 'linear-gradient(135deg, #FFB800, #FF6B6B)' }}>↓ Download</span>
                  </div>
                </div>

              </div>

              {/* Bottom label — dark */}
              <div className="px-5 py-3 flex items-center justify-center border-t" style={{ background: dark.surface, borderColor: dark.border }}>
                <span className="font-display text-xs px-4 py-1.5 rounded-full" style={{ color: demo.productColor, background: `${demo.productColor}18`, border: `1px solid ${demo.productColor}30` }}>
                  {demo.product}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
