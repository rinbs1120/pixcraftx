'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Sparkles, Loader2, Download, RotateCcw, AlertCircle, Palette, ImageIcon, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, SignIn } from '@clerk/nextjs';



const styles = [
  {
    id: 'simple' as const,
    label: 'Simple',
    emoji: '✏️',
    desc: 'Bold outlines, big areas',
  },
  {
    id: 'mandala' as const,
    label: 'Mandala',
    emoji: '🔮',
    desc: 'Symmetrical patterns',
  },
  {
    id: 'intricate' as const,
    label: 'Intricate',
    emoji: '🎨',
    desc: 'Fine details, rich scenes',
  },
];

const EXAMPLE_PROMPTS = [
  { emoji: '🐱', text: 'Cute cat sitting on a mushroom' },
  { emoji: '🏰', text: 'Princess castle in the clouds' },
  { emoji: '🦋', text: 'Butterfly garden' },
  { emoji: '🐉', text: 'Friendly dragon' },
  { emoji: '🌸', text: 'Cherry blossom flower garden' },
  { emoji: '🦁', text: 'Lion in the savanna' },
  { emoji: '🐟', text: 'Underwater coral reef' },
  { emoji: '🎄', text: 'Cozy cabin in snowy forest' },
];

const REFERENCE_PROMPT = { emoji: '📸', text: 'Transform this photo into a coloring page' };

function GenerateContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedStyle, setSelectedStyle] = useState<'simple' | 'mandala' | 'intricate'>('simple');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pagesUsed, setPagesUsed] = useState(0);
  const [pageLimit, setPageLimit] = useState(5);
  const [plan, setPlan] = useState('free');
  const [showSignIn, setShowSignIn] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceFileName, setReferenceFileName] = useState<string>('');

  useEffect(() => {
    const p = searchParams.get('p');
    const s = searchParams.get('s');
    if (p) setPrompt(decodeURIComponent(p));
    if (s && ['simple', 'mandala', 'intricate'].includes(s)) {
      setSelectedStyle(s as 'simple' | 'mandala' | 'intricate');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/usage')
      .then(res => res.json())
      .then(data => {
        if (data.plan) setPlan(data.plan);
        if (data.pagesUsed !== undefined) setPagesUsed(data.pagesUsed);
        if (data.limit) setPageLimit(data.limit);
      })
      .catch(() => {});
  }, [isSignedIn]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, WEBP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB');
      return;
    }
    setReferenceFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImage(reader.result as string);
      setPrompt(REFERENCE_PROMPT.text);
      setSelectedStyle('simple');
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const removeReference = () => {
    setReferenceImage(null);
    setPrompt('');
    setReferenceFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!isSignedIn) { setShowSignIn(true); return; }

    setIsGenerating(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt.trim(), 
          style: selectedStyle,
          referenceImageUrl: referenceImage,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          if (data.needed) {
            setError(`Not enough credits. This generation needs ${data.needed} credits, you have ${data.limit - data.used} remaining.`);
          } else {
            setError(`Monthly limit reached (${data.used}/${data.limit}). Upgrade your plan for more pages!`);
          }
        } else {
          setError(data.error || 'Generation failed. Please try again.');
        }
        return;
      }

      if (data.status === 'processing' && data.requestId) {
        setPagesUsed(data.pagesUsed);
        setPageLimit(data.limit);
        setPlan(data.plan);
        const maxAttempts = 30;
        let pollCompleted = false;
        let pollFailed = false;
        for (let i = 0; i < maxAttempts; i++) {
          await new Promise(r => setTimeout(r, 3000));
          try {
            const statusRes = await fetch(`/api/generate?requestId=${data.requestId}`);
            const statusData = await statusRes.json();
            if (statusData.status === 'completed') {
              setGeneratedImageUrl(statusData.imageUrl);
              pollCompleted = true;
              break;
            } else if (statusData.status === 'failed') {
              setError(statusData.error || 'Image generation failed. Please try again.');
              pollFailed = true;
              break;
            }
          } catch { /* retry */ }
        }
        if (!pollCompleted && !pollFailed) {
          setError('Generation is taking too long. Please try again.');
        }
      } else {
        setGeneratedImageUrl(data.imageUrl);
        setPagesUsed(data.pagesUsed);
        setPageLimit(data.limit);
        setPlan(data.plan);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImageUrl) return;
    try {
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pixcraftx-${selectedStyle}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-8 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          
          {/* ====== TOP: Compact Input Area ====== */}
          <div className="bg-card rounded-2xl p-4 md:p-5 shadow-sm border border-border mb-6">
            {/* Main input row */}
            <div className="flex items-end gap-2">
              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all",
                  referenceImage 
                    ? "border-[#FFB800] bg-[#FFB800]/10 text-[#FFB800]" 
                    : "border-[#E5E0D5] text-muted-foreground hover:border-[#FFB800] hover:text-[#FFB800]"
                )}
                title="Upload reference image (5 credits)"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Text input */}
              <div className="flex-1 relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  placeholder="Describe your coloring page..."
                  rows={1}
                  className="w-full px-4 py-2.5 text-sm bg-white border-2 border-[#E5E0D5] rounded-xl focus:border-[#FFB800] focus:ring-2 focus:ring-[#FFB800]/20 outline-none transition-all resize-none text-foreground placeholder:text-muted-foreground pr-12"
                  style={{ maxHeight: '120px' }}
                />
                <span className="absolute right-3 bottom-2 text-[10px] text-muted-foreground/50">
                  {prompt.length > 0 ? `${prompt.length}/500` : ''}
                </span>
              </div>

              {/* Style toggle */}
              <div className="flex-shrink-0 flex gap-1">
                {styles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    disabled={!!referenceImage}
                    className={cn(
                      "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all border",
                      selectedStyle === style.id && !referenceImage
                        ? "border-[#FFB800] bg-[#FFB800]/10 text-[#FFB800]"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                      referenceImage && "opacity-40 cursor-not-allowed"
                    )}
                    title={style.desc}
                  >
                    <span className="text-base leading-none">{style.emoji}</span>
                    <span>{style.label}</span>
                  </button>
                ))}
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || prompt.length > 500}
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFB800] to-[#FF6B6B] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(255,107,107,0.3)] hover:shadow-[0_4px_16px_rgba(255,107,107,0.4)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Reference image thumbnail */}
            {referenceImage && (
              <div className="relative inline-block mt-3">
                <img
                  src={referenceImage}
                  alt="Reference"
                  className="w-14 h-14 object-cover rounded-lg border border-[#E5E0D5]"
                />
                <button
                  onClick={removeReference}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
                <span className="text-[10px] text-muted-foreground block mt-1">5 credits</span>
              </div>
            )}

            {/* Example Prompts */}
            {!generatedImageUrl && !isGenerating && (
              <div className="mt-3 pt-3 border-t border-[#E5E0D5]/50">
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLE_PROMPTS.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(ex.text)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-full border border-[#E5E0D5] bg-white hover:border-[#FFB800] hover:bg-[#FFB800]/5 transition-all text-muted-foreground hover:text-foreground"
                    >
                      <span>{ex.emoji}</span>
                      <span>{ex.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Hint line */}
            <div className="flex items-center justify-between mt-2 px-0.5">
              <p className="text-[10px] text-muted-foreground">
                {referenceImage ? '📎 Reference mode' : `${styles.find(s => s.id === selectedStyle)?.emoji} ${styles.find(s => s.id === selectedStyle)?.label} style`}
                {!isSignedIn && isLoaded && (
                  <>
                    {' · '}
                    <button 
                      onClick={() => setShowSignIn(true)}
                      className="text-[#FFB800] hover:underline font-semibold"
                    >
                      Sign in for 5 free credits
                    </button>
                  </>
                )}
              </p>
              <p className="text-[10px] text-muted-foreground">Enter ↵ to generate</p>
            </div>

            {/* Usage bar (signed in) */}
            {isSignedIn && (
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[#E5E0D5]/50">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                  plan === 'business' ? 'bg-purple-100 text-purple-700' :
                  plan === 'pro' ? 'bg-amber-100 text-amber-700' :
                  plan === 'starter' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {plan}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      pagesUsed >= pageLimit ? 'bg-red-400' :
                      pagesUsed >= pageLimit * 0.8 ? 'bg-amber-400' :
                      'bg-green-400'
                    }`}
                    style={{ width: `${Math.min(100, (pagesUsed / pageLimit) * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {pagesUsed}/{pageLimit}
                </span>
                {pagesUsed >= pageLimit && (
                  <Link href="/pricing" className="text-[11px] text-[#FFB800] font-semibold hover:underline">
                    Upgrade →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium">{error}</p>
                {(error.includes('credit') || error.includes('limit')) && (
                  <Link href="/pricing" className="text-red-600 underline text-sm hover:text-red-800">
                    View pricing plans →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* ====== BOTTOM: Preview Area ====== */}
          <div className="flex flex-col items-center justify-center">
            {generatedImageUrl ? (
              <div className="w-full max-w-2xl">
                <div className="bg-card rounded-3xl p-4 md:p-6 shadow-lg border border-border">
                  <img
                    src={generatedImageUrl}
                    alt="Generated coloring page"
                    className="w-full h-auto object-contain rounded-xl"
                  />
                </div>
                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex-1 py-3 rounded-xl border-2 border-[#E5E0D5] text-foreground flex items-center justify-center gap-2 hover:border-[#FFB800] transition-all disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Regenerate
                  </button>
                  <Link
                    href={`/color?src=${encodeURIComponent(generatedImageUrl)}`}
                    className="flex-1 py-3 rounded-xl text-[#1A1A2E] font-semibold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)', boxShadow: '0 4px 12px rgba(255,107,107,0.3)' }}
                  >
                    <Palette className="w-4 h-4" />
                    Color It!
                  </Link>
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-3 rounded-xl bg-[#1A1A2E] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#1A1A2E]/90 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            ) : isGenerating ? (
              <div className="text-center py-16">
                <div className="relative mb-6">
                  <div className="w-24 h-24 mx-auto rounded-full border-4 border-[#FFB800]/20 border-t-[#FFB800] animate-spin" />
                  <Sparkles className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#FFB800]" />
                </div>
                <p className="text-xl font-semibold text-foreground mb-2">Creating your coloring page...</p>
                <p className="text-sm text-muted-foreground">
                  {referenceImage ? 'Transforming your reference image...' : 'This usually takes 10-30 seconds'}
                </p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-16">
                <div className="relative mb-6">
                  <Sparkles className="w-20 h-20 mx-auto text-[#FFB800]/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Wand2 className="w-8 h-8 text-[#FFB800]/40" />
                  </div>
                </div>
                <p className="text-xl font-semibold mb-2 text-foreground/60">Your coloring page will appear here</p>
                <p className="text-sm max-w-xs mx-auto">
                  Type a description and hit Generate
                </p>
              </div>
            )}
          </div>

          {/* Feedback */}
          <div className="text-center mt-8">
            <a
              href="mailto:support@pixcraftx.com?subject=PixCraftX%20Feedback"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#FFB800] transition-colors"
            >
              💬 Have feedback? We&apos;d love to hear from you
            </a>
          </div>
        </div>
      </main>
      <Footer />

      {/* Sign In Modal */}
      {showSignIn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowSignIn(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
            <h3 className="font-display text-xl mb-4 text-center text-foreground">Sign in to Generate</h3>
            <SignIn routing="hash" />
          </div>
        </div>
      )}
    </>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFB800]" />
      </div>
    }>
      <GenerateContent />
    </Suspense>
  );
}
