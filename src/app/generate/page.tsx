'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Sparkles, Loader2, Download, RotateCcw, AlertCircle, Palette, MessageCircle, Upload, X, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, SignIn } from '@clerk/nextjs';



const styles = [
  {
    id: 'simple' as const,
    label: 'Simple',
    desc: 'Bold outlines, big areas \u2014 easy & fun',
    image: '/styles/simple.jpg',
  },
  {
    id: 'mandala' as const,
    label: 'Mandala',
    desc: 'Symmetrical patterns \u2014 relaxing',
    image: '/styles/mandala.jpg',
  },
  {
    id: 'intricate' as const,
    label: 'Intricate',
    desc: 'Fine details, rich scenes \u2014 immersive',
    image: '/styles/intricate.jpg',
  },
];

const EXAMPLE_PROMPTS = [
  { emoji: '\ud83d\udc31', text: 'Cute cat sitting on a mushroom' },
  { emoji: '\ud83c\udff0', text: 'Princess castle in the clouds' },
  { emoji: '\ud83e\udd8b', text: 'Butterfly garden' },
  { emoji: '\ud83d\udc09', text: 'Friendly dragon' },
  { emoji: '\ud83c\udf38', text: 'Cherry blossom flower garden' },
  { emoji: '\ud83e\udd81', text: 'Lion in the savanna' },
  { emoji: '\ud83d\udc1f', text: 'Underwater coral reef' },
  { emoji: '\ud83c\udf84', text: 'Cozy cabin in snowy forest' },
];

// Prompt templates for reference image uploads
const REFERENCE_PROMPTS = [
  { emoji: '\ud83d\udcf7', text: 'Transform this photo into a coloring page' },
  { emoji: '\ud83d\udc3e', text: 'Keep the pose, make it a coloring page' },
  { emoji: '\ud83c\udf3f', text: 'Convert this landscape into a coloring scene' },
  { emoji: '\ud83d\udc64', text: 'Turn this portrait into a coloring page' },
];

// Trial pricing info
const TRIAL_END = new Date('2026-09-01T00:00:00Z');
const REFERENCE_COST_NORMAL = 3;
const REFERENCE_COST_TRIAL = 2;
function getReferenceCostInfo() {
  const isTrial = new Date() < TRIAL_END;
  return {
    current: isTrial ? REFERENCE_COST_TRIAL : REFERENCE_COST_NORMAL,
    original: REFERENCE_COST_NORMAL,
    isTrial,
  };
}

function GenerateContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
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

  // Reference image state
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceFileName, setReferenceFileName] = useState<string>('');

  // From URL params
  useEffect(() => {
    const p = searchParams.get('p');
    const s = searchParams.get('s');
    if (p) setPrompt(decodeURIComponent(p));
    if (s && ['simple', 'mandala', 'intricate'].includes(s)) {
      setSelectedStyle(s as 'simple' | 'mandala' | 'intricate');
    }
  }, [searchParams]);

  // Fetch usage
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
    reader.onload = () => setReferenceImage(reader.result as string);
    reader.readAsDataURL(file);
    setError(null);
  };

  const removeReference = () => {
    setReferenceImage(null);
    setReferenceFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

      // If reference image mode, poll for result (async generation)
      if (data.status === 'processing' && data.requestId) {
        setPagesUsed(data.pagesUsed);
        setPageLimit(data.limit);
        setPlan(data.plan);

        // Poll every 3 seconds, max 90 seconds
        // Use local vars to avoid React stale closure bug
        const maxAttempts = 30;
        let pollCompleted = false;
        let pollFailed = false;

        for (let i = 0; i < maxAttempts; i++) {
          await new Promise(r => setTimeout(r, 3000));
          try {
            const statusRes = await fetch(`/api/generate/status?requestId=${data.requestId}`);
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
            // Still processing, continue polling
          } catch {
            // Network error on poll, retry
          }
        }
        // Only show timeout if polling ended without success or failure
        if (!pollCompleted && !pollFailed) {
          setError('Generation is taking too long. Please try again.');
        }
      } else {
        // Direct result (text-to-image, fast)
        setGeneratedImageUrl(data.imageUrl);
        setPagesUsed(data.pagesUsed);
        setPageLimit(data.limit);
        setPlan(data.plan);
      }
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

  const pricingInfo = getReferenceCostInfo();

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
              Describe what you want, upload a reference, and pick a style
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

                {/* Example Prompts */}
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">Need inspiration? Try these:</p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_PROMPTS.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => setPrompt(ex.text)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full border border-[#E5E0D5] bg-white hover:border-[#FFB800] hover:bg-[#FFB800]/5 transition-all text-muted-foreground hover:text-foreground"
                      >
                        <span>{ex.emoji}</span>
                        <span>{ex.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reference Image Upload */}
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-foreground">
                    Reference image <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Cost: {pricingInfo.isTrial ? (
                      <>
                        <span className="line-through text-red-400">{pricingInfo.original}</span>
                        <span className="ml-1 font-semibold text-green-600">{pricingInfo.current} credits</span>
                        <span className="ml-1 text-green-600">Launch deal!</span>
                      </>
                    ) : (
                      <span>{pricingInfo.current} credits</span>
                    )}
                  </span>
                </div>
                
                {referenceImage ? (
                  <div className="relative group">
                    <img
                      src={referenceImage}
                      alt="Reference"
                      className="w-full max-h-48 object-contain rounded-xl border border-[#E5E0D5]"
                    />
                    <button
                      onClick={removeReference}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-muted-foreground mt-2 truncate">{referenceFileName}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-[#E5E0D5] rounded-xl hover:border-[#FFB800] hover:bg-[#FFB800]/5 transition-all flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Upload className="w-8 h-8" />
                    <span className="text-sm font-medium">Click or drag to upload a reference image</span>
                    <span className="text-xs">PNG, JPG, WEBP up to 10MB</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Upload a photo and we'll transform it into a coloring page while keeping the composition
                </p>
                {/* Reference prompt suggestions */}
                {referenceImage && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">Prompt suggestions for your reference:</p>
                    <div className="flex flex-wrap gap-2">
                      {REFERENCE_PROMPTS.map((ex, i) => (
                        <button
                          key={i}
                          onClick={() => setPrompt(ex.text)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full border border-[#FFB800]/50 bg-[#FFB800]/5 hover:bg-[#FFB800]/10 transition-all text-[#4A4A5E]"
                        >
                          <span>{ex.emoji}</span>
                          <span>{ex.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Style Selection - Visual Cards */}
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <label className="block text-sm font-semibold mb-4 text-foreground">
                  Choose a style
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {styles.map((style) => {
                    return (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                          selectedStyle === style.id
                            ? 'border-[#FFB800] bg-[#FFB800]/10 shadow-[0_2px_8px_rgba(255,184,0,0.2)]'
                            : 'border-[#E5E0D5] bg-background hover:border-[#FFB800]/50'
                        )}
                      >
                        <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#FFFBF0]">
                          <Image src={style.image} alt={style.label} width={120} height={120} className="w-full h-full object-cover" />
                        </div>
                        <span className={cn(
                          "text-sm font-semibold",
                          selectedStyle === style.id ? "text-[#FFB800]" : "text-foreground"
                        )}>{style.label}</span>
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">{style.desc}</span>
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
                    {error.includes('credit') || error.includes('limit') ? (
                      <Link href="/pricing" className="text-red-600 underline text-sm hover:text-red-800">
                        View pricing plans →
                      </Link>
                    ) : null}
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
                      {pagesUsed}/{pageLimit} credits
                    </span>
                  </div>
                  {pagesUsed >= pageLimit && (
                    <Link href="/pricing" className="block mt-2 text-center text-sm text-[#FFB800] font-semibold hover:underline">
                      Upgrade for more credits →
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
                  {' '}for 5 free credits per month
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
                        {referenceImage ? 'Transforming your reference image...' : 'This usually takes 10-30 seconds'}
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

              {/* Feedback */}
              <div className="text-center">
                <a
                  href="mailto:support@pixcraftx.com?subject=ColorForge%20Feedback"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#FFB800] transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Have feedback? We'd love to hear from you
                </a>
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
