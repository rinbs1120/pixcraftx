'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Sparkles, Loader2, Download, RotateCcw, Baby, Flower2, PenTool, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, SignIn } from '@clerk/nextjs';


const styles = [
  { id: 'kids', label: 'Kids', icon: Baby, desc: 'Bold lines, simple shapes' },
  { id: 'mandala', label: 'Mandala', icon: Flower2, desc: 'Symmetrical patterns' },
  { id: 'detailed', label: 'Detailed', icon: PenTool, desc: 'Fine details for adults' },
] as const;

function GenerateContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [selectedStyle, setSelectedStyle] = useState<'kids' | 'mandala' | 'detailed'>('kids');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pagesUsed, setPagesUsed] = useState(0);
  const [pageLimit, setPageLimit] = useState(5);
  const [plan, setPlan] = useState('free');
  const [showSignIn, setShowSignIn] = useState(false);

  // 从URL参数预填prompt和style
  useEffect(() => {
    const p = searchParams.get('p');
    const s = searchParams.get('s');
    if (p) setPrompt(decodeURIComponent(p));
    if (s && ['kids', 'mandala', 'detailed'].includes(s)) {
      setSelectedStyle(s as 'kids' | 'mandala' | 'detailed');
    }
  }, [searchParams]);

  // 获取用户套餐和用量
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

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    if (!isSignedIn) {
      setShowSignIn(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), style: selectedStyle }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(`Monthly limit reached (${data.used}/${data.limit}). Upgrade your plan for more pages!`);
        } else {
          setError(data.error || 'Generation failed. Please try again.');
        }
        return;
      }

      setGeneratedImageUrl(data.imageUrl);
      setPagesUsed(data.pagesUsed);
      setPageLimit(data.limit);
      setPlan(data.plan);
    } catch (err) {
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
      a.download = `colorforge-${selectedStyle}-${Date.now()}.png`;
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
      <main className="min-h-screen pt-20 pb-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl md:text-4xl mb-3 text-foreground">
              Create Your Coloring Page
            </h1>
            <p className="text-muted-foreground text-lg">
              Describe what you want to see, or upload an image to convert
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left - Controls */}
            <div className="space-y-6">
              {/* Prompt Input */}
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <label className="block text-sm font-semibold mb-3 text-foreground">
                  Describe your coloring page
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A cute dinosaur eating ice cream in a park..."
                  className="w-full h-32 px-4 py-3 text-base bg-background border-2 border-[#E5E0D5] rounded-2xl focus:border-[#FFB800] focus:ring-2 focus:ring-[#FFB800]/20 outline-none transition-all resize-none text-foreground placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {prompt.length}/500 characters
                </p>
              </div>

              {/* Style Selection */}
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <label className="block text-sm font-semibold mb-4 text-foreground">
                  Choose a style
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {styles.map((style) => {
                    const Icon = style.icon;
                    return (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id as typeof selectedStyle)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                          selectedStyle === style.id
                            ? 'border-[#FFB800] bg-[#FFB800]/10 text-[#FFB800]'
                            : 'border-[#E5E0D5] bg-background hover:border-[#FFB800]/50 text-foreground'
                        )}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-sm font-semibold">{style.label}</span>
                        <span className="text-xs text-muted-foreground">{style.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>



              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-700 font-medium">{error}</p>
                    {error.includes('limit') && (
                      <Link href="/pricing" className="text-red-600 underline text-sm hover:text-red-800">
                        View pricing plans →
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || prompt.length > 500}
                className="w-full py-4 bg-gradient-to-r from-[#FFB800] to-[#FF6B6B] text-[#1A1A2E] font-bold text-lg rounded-full shadow-[0_4px_16px_rgba(255,107,107,0.3)] hover:shadow-[0_8px_24px_rgba(255,107,107,0.4)] transition-all hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Coloring Page
                  </>
                )}
              </button>

              {/* Usage Display */}
              {isSignedIn && (
                <div className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                        plan === 'business' ? 'bg-purple-100 text-purple-700' :
                        plan === 'pro' ? 'bg-amber-100 text-amber-700' :
                        plan === 'starter' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {plan}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {plan === 'free' ? 'Free Plan' : `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`}
                      </span>
                    </div>
                    {plan !== 'free' && (
                      <Link href="/pricing" className="text-xs text-muted-foreground hover:text-primary">
                        Manage →
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          pagesUsed >= pageLimit ? 'bg-red-400' :
                          pagesUsed >= pageLimit * 0.8 ? 'bg-amber-400' :
                          'bg-green-400'
                        }`}
                        style={{ width: `${Math.min(100, (pagesUsed / pageLimit) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {pagesUsed}/{pageLimit}
                    </span>
                  </div>
                  {pagesUsed >= pageLimit && (
                    <Link href="/pricing" className="block mt-2 text-center text-sm text-[#FFB800] font-semibold hover:underline">
                      Upgrade for more pages →
                    </Link>
                  )}
                </div>
              )}

              {!isSignedIn && isLoaded && (
                <p className="text-center text-sm text-muted-foreground">
                  <button 
                    onClick={() => setShowSignIn(true)}
                    className="text-[#FFB800] hover:underline font-semibold"
                  >
                    Sign in
                  </button>
                  {' '}for 5 free pages per month
                </p>
              )}
            </div>

            {/* Right - Preview */}
            <div className="space-y-6">
              <div className="bg-card rounded-3xl p-6 shadow-lg border border-border min-h-[500px] flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                  {generatedImageUrl ? (
                    <img
                        src={generatedImageUrl}
                        alt="Generated coloring page"
                        className="w-full h-auto max-h-[600px] object-contain rounded-xl"
                      />
                  ) : isGenerating ? (
                    <div className="text-center">
                      <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#FFB800] animate-spin" />
                      <p className="text-lg font-medium text-foreground mb-2">Generating your coloring page...</p>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        This usually takes 10-30 seconds
                      </p>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Sparkles className="w-16 h-16 mx-auto mb-4 text-[#FFB800]/40" />
                      <p className="text-lg font-medium mb-2">Your coloring page will appear here</p>
                      <p className="text-sm max-w-xs mx-auto">
                        Enter a description and select a style, then click Generate
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={!generatedImageUrl || isGenerating}
                  className="flex-1 py-3 rounded-xl border-2 border-[#E5E0D5] text-foreground flex items-center justify-center gap-2 hover:border-[#FFB800] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-4 h-4" />
                  Regenerate
                </button>
                {generatedImageUrl && (
                  <Link
                    href={`/color?src=${encodeURIComponent(generatedImageUrl)}`}
                    className="flex-1 py-3 rounded-xl text-[#1A1A2E] font-semibold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)', boxShadow: '0 4px 12px rgba(255,107,107,0.3)' }}
                  >
                    <Palette className="w-4 h-4" />
                    Color It!
                  </Link>
                )}
                <button
                  onClick={handleDownload}
                  disabled={!generatedImageUrl}
                  className="flex-1 py-3 rounded-xl bg-[#1A1A2E] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#1A1A2E]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Download PNG
                </button>
              </div>
            </div>
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
