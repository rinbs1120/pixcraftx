'use client';

import { useState, useEffect, useMemo } from 'react';
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
const STEP_DURATIONS = [3200, 2800, 2800, 4000];
const WORD_TYPING_INTERVAL = 450;

export function Hero() {
  const [phase, setPhase] = useState(0);
  const [visibleWords, setVisibleWords] = useState(0);

  const totalPhases = demoFlows.length * STEP_COUNT;
  const demoIdx = Math.floor(phase / STEP_COUNT) % demoFlows.length;
  const stepIdx = phase % STEP_COUNT;
  const demo = demoFlows[demoIdx];
  const is3D = stepIdx === 3;

  // Mechanical typing — word by word
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

  // Phase auto-advance
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

          {/* Right: Mini App Demo */}
          <div className="hidden lg:flex lg:justify-center lg:items-center">
            <div className="relative rounded-2xl bg-white overflow-hidden" style={{ width: '480px', boxShadow: '0 16px 48px rgba(26,26,46,0.15), 0 4px 12px rgba(26,26,46,0.08)', animation: 'heroTransformSlideIn 0.8s ease-out both' }}>
              {/* Window bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100" style={{ background: '#FAFAF7' }}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF6B6B' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FFB800' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#2ECC71' }} />
                </div>
                <span className="font-display text-xs text-muted-foreground ml-2">PixCraftX</span>
                <div className="ml-auto flex gap-1.5">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="rounded-full transition-all duration-500" style={{ width: stepIdx===i?'18px':'6px', height:'6px', background: stepIdx>=i?(i===0?'#1A1A2E':i===1?'#FFB800':i===2?'#FF6B6B':'#2ECC71'):'#E5E0D5' }} />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="relative" style={{ minHeight: '360px' }}>

                {/* STEP 0: Generate — typing prompt + line art result */}
                <div className="absolute inset-0 flex flex-col transition-all duration-700" style={{ opacity: stepIdx===0?1:0, transform: stepIdx===0?'translateX(0)':'translateX(-30px)', pointerEvents: stepIdx===0?'auto':'none' }}>
                  <div className="px-4 pt-4 pb-2">
                    <div className="rounded-xl border border-gray-200 px-3 py-2.5 text-xs" style={{ background: '#FFFBF0', minHeight: '32px' }}>
                      <span className="text-muted-foreground mr-1">✨</span>
                      {demo.promptWords.map((word, i) => (
                        <span key={i} className="inline transition-all duration-200" style={{ opacity: i < visibleWords ? 1 : 0, color: '#1A1A2E' }}>
                          {word}{i < demo.promptWords.length - 1 ? ' ' : ''}
                        </span>
                      ))}
                      <span className="inline-block w-[2px] h-3 ml-0.5 align-middle" style={{ background: '#FFB800', animation: 'heroBlink 0.8s step-end infinite' }} />
                    </div>
                    <button className="mt-2 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #FFB800, #FF6B6B)' }}>Generate Line Art</button>
                  </div>
                  <div className="flex-1 px-4 pb-4">
                    <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '3/4', background: '#FFFBF0', maxHeight: '260px' }}>
                      <Image src={demo.images.lineart} alt="Generated line art" width={480} height={640} className="w-full h-full object-cover" style={{ opacity: stepIdx===0?1:0, animation: stepIdx===0?'heroFadeIn 0.8s ease-out 2.2s both':'none' }} />
                    </div>
                  </div>
                </div>

                {/* STEP 1: Color & Style */}
                <div className="absolute inset-0 flex transition-all duration-700" style={{ opacity: stepIdx===1?1:0, transform: stepIdx===1?'translateX(0)':stepIdx<1?'translateX(30px)':'translateX(-30px)', pointerEvents: stepIdx===1?'auto':'none' }}>
                  <div className="w-[140px] p-3 border-r border-gray-50" style={{ background: '#FDFCFA' }}>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Art Style</p>
                    {['Pastel', demo.styleName, 'Muted'].map((name) => {
                      const sel = name === demo.styleName;
                      return (
                        <div key={name} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg mb-1 text-[10px]" style={{ background: sel?'#FFF3CC':'transparent', border: sel?'1.5px solid #FFB800':'1.5px solid transparent', fontWeight: sel?700:400, color: sel?'#1A1A2E':'#6B7280' }}>
                          <div className="w-3 h-3 rounded-full" style={{ background: name==='Pastel'?'#FFD1DC':name===demo.styleName?'#FF6B6B':'#A8B5A0' }} />
                          {name}
                        </div>
                      );
                    })}
                    <button className="mt-2 w-full px-2 py-1.5 rounded-lg text-[9px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #FFB800, #FF6B6B)' }}>Color It!</button>
                  </div>
                  <div className="flex-1 p-3">
                    <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '3/4', background: '#FFFBF0', maxHeight: '300px' }}>
                      <Image src={demo.images.lineart} alt="Line art" width={480} height={640} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000" style={{ opacity: 0 }} />
                      <Image src={demo.images.colored} alt="Colored" width={480} height={640} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000" style={{ opacity: 1 }} />
                    </div>
                  </div>
                </div>

                {/* STEP 2: Product */}
                <div className="absolute inset-0 flex transition-all duration-700" style={{ opacity: stepIdx===2?1:0, transform: stepIdx===2?'translateX(0)':stepIdx<2?'translateX(30px)':'translateX(-30px)', pointerEvents: stepIdx===2?'auto':'none' }}>
                  <div className="w-[140px] p-3 border-r border-gray-50" style={{ background: '#FDFCFA' }}>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Product</p>
                    {[
                      { name: 'Canvas Print', bg: '#E5E0D5' },
                      { name: demo.product, bg: demo.productColor },
                      { name: demo.id==='panda'?'Fridge Magnet':'Sticker', bg: '#E5E0D5' },
                    ].map((p) => {
                      const sel = p.name === demo.product;
                      return (
                        <div key={p.name} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg mb-1 text-[10px]" style={{ background: sel?(demo.product==='Sticker'?'#FFE0E0':'#FFF3CC'):'transparent', border: sel?`1.5px solid ${demo.productColor}`:'1.5px solid transparent', fontWeight: sel?700:400, color: sel?'#1A1A2E':'#6B7280' }}>
                          <div className="w-3 h-3 rounded" style={{ background: p.bg }} />
                          {p.name}
                        </div>
                      );
                    })}
                    <button className="mt-2 w-full px-2 py-1.5 rounded-lg text-[9px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #FFB800, #FF6B6B)' }}>Create Product</button>
                  </div>
                  <div className="flex-1 p-3">
                    <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '3/4', background: '#FFFBF0', maxHeight: '300px' }}>
                      <Image src={demo.images.product} alt={demo.product} width={480} height={640} className="absolute inset-0 w-full h-full object-contain transition-opacity duration-800" style={{ opacity: 1, background: '#FFFBF0' }} />
                    </div>
                  </div>
                </div>

                {/* STEP 3: 3D Showcase — transparent bg, real 3D rotation */}
                <div className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-700" style={{ opacity: stepIdx===3?1:0, transform: stepIdx===3?'translateX(0) scale(1)':'translateX(30px) scale(0.95)', pointerEvents: stepIdx===3?'auto':'none', background: 'radial-gradient(ellipse at center, #F5F0E8 0%, #FFFBF0 70%)' }}>
                  {/* Subtle surface reflection */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200px] h-[30px] rounded-full" style={{ background: `radial-gradient(ellipse, ${demo.productColor}15 0%, transparent 70%)`, filter: 'blur(8px)' }} />

                  {/* 3D product */}
                  <div style={{ perspective: '1000px' }}>
                    <div
                      style={{
                        transformStyle: 'preserve-3d',
                        animation: is3D ? 'hero3DRotate 4s ease-in-out infinite' : 'none',
                      }}
                    >
                      <div className="relative" style={{ width: '180px', height: '240px' }}>
                        {/* The product image — transparent PNG, no background */}
                        <Image
                          src={demo.images.product}
                          alt={demo.product}
                          width={480}
                          height={640}
                          className="w-full h-full object-contain"
                          style={{
                            filter: 'drop-shadow(0 8px 24px rgba(26,26,46,0.2))',
                          }}
                        />
                        {/* Subtle edge highlight for 3D feel */}
                        <div className="absolute inset-0 pointer-events-none rounded-lg" style={{ boxShadow: `0 0 0 1px ${demo.productColor}10, 0 12px 40px ${demo.productColor}20` }} />
                      </div>
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="flex gap-2 mt-5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-[#2ECC71]" style={{ background: '#E8F8F0' }}>✓ BG Removed</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #FFB800, #FF6B6B)' }}>↓ Download</span>
                  </div>
                </div>

              </div>

              {/* Bottom label */}
              <div className="px-4 py-2.5 flex items-center justify-center border-t border-gray-50" style={{ background: '#FAFAF7' }}>
                <span className="font-display text-xs px-3 py-1 rounded-full" style={{ color: demo.productColor, background: demo.product==='Sticker'?'#FFE0E0':'#FFF3CC' }}>{demo.product}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
