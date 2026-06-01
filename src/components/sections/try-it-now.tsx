'use client';

import { useState } from 'react';
import { Sparkles, RefreshCw, Download, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, SignIn } from '@clerk/nextjs';

const styles = [
  { id: 'simple', label: 'Simple', description: 'Bold outlines, big areas' },
  { id: 'mandala', label: 'Mandala', description: 'Symmetrical patterns' },
  { id: 'intricate', label: 'Intricate', description: 'Fine details, rich scenes' },
];

const SimpleResultSVG = () => (
  <svg viewBox="0 0 360 480" fill="none" className="w-full h-full">
    <rect width="360" height="480" fill="#FFFDF5"/>
    <circle cx="180" cy="180" r="80" stroke="currentColor" strokeWidth="3" fill="none"/>
    <circle cx="150" cy="160" r="12" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="210" cy="160" r="12" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="150" cy="160" r="4" fill="currentColor"/>
    <circle cx="210" cy="160" r="4" fill="currentColor"/>
    <path d="M150 210 Q180 240 210 210" stroke="currentColor" strokeWidth="3" fill="none"/>
    <ellipse cx="180" cy="380" rx="60" ry="50" stroke="currentColor" strokeWidth="3" fill="none"/>
    <circle cx="160" cy="400" r="15" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="200" cy="400" r="15" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M60 80 L65 60 L70 80 L85 85 L70 90 L65 110 L60 90 L45 85 Z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="300" cy="120" r="25" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

const MandalaResultSVG = () => (
  <svg viewBox="0 0 360 480" fill="none" className="w-full h-full">
    <rect width="360" height="480" fill="#FFFDF5"/>
    <circle cx="180" cy="240" r="20" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="180" cy="240" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <ellipse cx="180" cy="200" rx="15" ry="30" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <ellipse cx="180" cy="280" rx="15" ry="30" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <ellipse cx="140" cy="240" rx="30" ry="15" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <ellipse cx="220" cy="240" rx="30" ry="15" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <circle cx="180" cy="240" r="60" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="180" cy="240" r="90" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <circle cx="180" cy="240" r="120" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
);

const IntricateResultSVG = () => (
  <svg viewBox="0 0 360 480" fill="none" className="w-full h-full">
    <rect width="360" height="480" fill="#FFFDF5"/>
    <rect x="100" y="180" width="160" height="160" stroke="currentColor" strokeWidth="2" fill="none"/>
    <rect x="70" y="130" width="50" height="210" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M70 130 L95 90 L120 130" stroke="currentColor" strokeWidth="2" fill="none"/>
    <rect x="240" y="130" width="50" height="210" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M240 130 L265 90 L290 130" stroke="currentColor" strokeWidth="2" fill="none"/>
    <rect x="150" y="100" width="60" height="80" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M150 100 L180 60 L210 100" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M30 340 L330 340" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M60 60 C60 50, 70 40, 85 45 C90 35, 105 35, 110 45 C120 40, 130 50, 125 60" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
);

export function TryItNow() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [selectedStyle, setSelectedStyle] = useState('simple');
  const [prompt, setPrompt] = useState('A friendly dragon flying over a castle');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  const handleGenerate = () => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setShowSignIn(true);
      return;
    }
    router.push(`/generate?p=${encodeURIComponent(prompt)}&s=${selectedStyle}`);
  };

  const handleDemoGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowResult(true);
    }, 2000);
  };

  return (
    <section id="try-it" className="py-16 md:py-24" style={{ background: 'linear-gradient(180deg, #FFFBF0 0%, #FFF8E8 100%)' }}>
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">Try It Now</h2>
          <p className="text-muted-foreground">Describe what you want to color, choose a style, and generate!</p>
        </div>
        <div className="space-y-6">
          <div className="relative">
            <input type="text" placeholder="A cute dinosaur eating ice cream..." value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-[#E8E0D5] bg-white focus:outline-none focus:border-[#FFB800] focus:ring-4 focus:ring-[#FFB800]/20 transition-all text-foreground placeholder:text-muted-foreground" />
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {styles.map((style) => (
              <button key={style.id} onClick={() => setSelectedStyle(style.id)} className={`px-5 py-2.5 rounded-full font-semibold transition-all ${selectedStyle === style.id ? 'border-2 border-[#FFB800] bg-[#FFF3CC] text-foreground' : 'border-2 border-[#E8E0D5] bg-white text-muted-foreground hover:border-[#FFB800]/50'}`}>
                {style.label}
              </button>
            ))}
          </div>
          <div className="flex justify-center">
            <button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-lg rounded-full transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed text-[#1A1A2E]" style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)', boxShadow: '0 2px 8px rgba(255,184,0,0.3)' }}>
              {isGenerating ? (<><Loader2 className="w-5 h-5 animate-spin" />Generating...</>) : (<><Sparkles className="w-5 h-5" />Generate</>)}
            </button>
          </div>
          {showResult && (
            <div className="mt-8 p-6 rounded-3xl bg-white animate-in fade-in duration-500" style={{ boxShadow: '0 8px 24px rgba(26,26,46,0.12)' }}>
              <div className="text-[#1A1A2E]">
                {selectedStyle === 'simple' && <SimpleResultSVG />}
                {selectedStyle === 'mandala' && <MandalaResultSVG />}
                {selectedStyle === 'intricate' && <IntricateResultSVG />}
              </div>
              <div className="flex justify-center gap-4 mt-6">
                <button onClick={handleDemoGenerate} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-[#E8E0D5] bg-white text-muted-foreground hover:border-[#FFB800] hover:text-[#FFB800] transition-all"><RefreshCw className="w-4 h-4" />Regenerate</button>
                <Link href="/generate" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1A1A2E] text-white hover:bg-[#1A1A2E]/90 transition-all"><Download className="w-4 h-4" />Download PNG</Link>
              </div>
            </div>
          )}
          <p className="text-center text-sm text-muted-foreground"><span className="inline-flex items-center gap-1"><Sparkles className="w-4 h-4 text-[#FFB800]" />Powered by AI •</span>{' '}Get high-quality line art ready for printing</p>
        </div>
      </div>
      {showSignIn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 relative">
            <button onClick={() => setShowSignIn(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl">✕</button>
            <h3 className="font-display text-xl mb-4 text-center text-foreground">Sign in to Generate</h3>
            <SignIn routing="hash" />
          </div>
        </div>
      )}
    </section>
  );
}
