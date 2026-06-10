'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Loader2, Download, AlertCircle, Palette, ImageIcon, Upload, Paintbrush } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, SignIn } from '@clerk/nextjs';

const COLOR_PALETTES = [
  {
    id: 'pastel',
    label: 'Pastel',
    emoji: '🩷',
    desc: 'Macaron shades, soft & dreamy',
    preview: 'linear-gradient(135deg, #FFB5C2 0%, #C5A3FF 30%, #98D8C8 60%, #FFDAB9 100%)',
  },
  {
    id: 'vivid',
    label: 'Vivid',
    emoji: '🎨',
    desc: 'Bold, bright, cartoon colors',
    preview: 'linear-gradient(135deg, #FF3366 0%, #FFCC00 33%, #00CCFF 66%, #FF6600 100%)',
  },
  {
    id: 'muted',
    label: 'Muted',
    emoji: '🌿',
    desc: 'Earthy tones, vintage & warm',
    preview: 'linear-gradient(135deg, #A8B5A2 0%, #C4A882 33%, #C9A0A0 66%, #D4C5A9 100%)',
  },
];

type ImageSource = 'mypages' | 'upload';

function AutoColorContent() {
  const { isSignedIn, isLoaded } = useAuth();

  const [imageSource, setImageSource] = useState<ImageSource>('mypages');
  const [uploadImage, setUploadImage] = useState<string | null>(null);
  const [myPagesIdx, setMyPagesIdx] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<{ url: string; style: string; prompt: string; ts: number }[]>([]);

  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);
  const [isAutoColoring, setIsAutoColoring] = useState(false);
  const [autoColorImageUrl, setAutoColorImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pagesUsed, setPagesUsed] = useState(0);
  const [pageLimit, setPageLimit] = useState(5);
  const [plan, setPlan] = useState('free');
  const [showSignIn, setShowSignIn] = useState(false);

  const getSourceImage = (): string | null => {
    if (imageSource === 'upload' && uploadImage) return uploadImage;
    if (imageSource === 'mypages' && history.length > 0) return history[myPagesIdx]?.url || history[0].url;
    return null;
  };

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

  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        if (data.records) {
          setHistory(data.records.map((r: any) => ({
            url: r.image_url,
            style: r.style,
            prompt: r.prompt,
            ts: new Date(r.created_at).getTime(),
          })));
        }
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
    const reader = new FileReader();
    reader.onload = () => {
      setUploadImage(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAutoColor = async () => {
    if (!isSignedIn) { setShowSignIn(true); return; }
    if (!selectedPalette) { setError('Please select a color palette'); return; }

    const sourceImage = getSourceImage();
    if (!sourceImage) { setError('Please select or upload a coloring page first'); return; }

    setIsAutoColoring(true);
    setError(null);

    try {
      const res = await fetch('/api/auto-color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: sourceImage, palette: selectedPalette }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Auto color failed');
        if (data.limit) setPageLimit(data.limit);
        if (data.used !== undefined) setPagesUsed(data.used);
        return;
      }

      setAutoColorImageUrl(data.imageUrl);
      if (data.pagesUsed !== undefined) setPagesUsed(data.pagesUsed);
      if (data.limit) setPageLimit(data.limit);
      if (data.plan) setPlan(data.plan);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsAutoColoring(false);
    }
  };

  const handleReset = () => {
    setAutoColorImageUrl(null);
    setSelectedPalette(null);
    setError(null);
  };

  const handleDownload = () => {
    if (!autoColorImageUrl) return;
    const a = document.createElement('a');
    a.href = autoColorImageUrl;
    a.download = `pixcraftx-autocolor-${selectedPalette}-${Date.now()}.png`;
    a.click();
  };

  const creditsLeft = pageLimit - pagesUsed;
  const sourceImage = getSourceImage();

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">

          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
              <Paintbrush className="w-8 h-8 inline-block mr-2 text-[#FF6B6B]" />
              Auto Color
            </h1>
            <p className="text-muted-foreground">
              Pick a coloring page, choose a palette, and let AI fill in the colors for you.
            </p>
          </div>

          <div className="flex gap-6">

            {/* Left Panel */}
            <div className="w-[340px] flex-shrink-0 space-y-4">

              {/* Step 1: Choose Image */}
              <div className="rounded-2xl p-4 shadow-sm border border-border bg-white">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#FFB800] text-white text-[10px] flex items-center justify-center font-bold">1</span>
                  Choose a Coloring Page
                </h3>

                <div className="flex gap-1 mb-3 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setImageSource('mypages')}
                    className={cn(
                      "flex-1 py-1.5 rounded-md text-xs font-semibold transition-all",
                      imageSource === 'mypages' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    🖼️ My Pages
                  </button>
                  <button
                    onClick={() => setImageSource('upload')}
                    className={cn(
                      "flex-1 py-1.5 rounded-md text-xs font-semibold transition-all",
                      imageSource === 'upload' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    📁 Upload
                  </button>
                </div>

                {imageSource === 'mypages' && (
                  <>
                    {history.length > 0 ? (
                      <div className="grid grid-cols-5 gap-1.5">
                        {history.slice(0, 10).map((item, i) => (
                          <button
                            key={item.ts}
                            onClick={() => setMyPagesIdx(i)}
                            className={cn(
                              "aspect-[3/4] rounded-md overflow-hidden border-2 transition-all",
                              myPagesIdx === i ? "border-[#FFB800] shadow-sm" : "border-[#E5E0D5] hover:border-[#FFB800]/50"
                            )}
                            title={item.prompt}
                          >
                            <img src={item.url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="text-xs text-muted-foreground">No pages yet</p>
                        <a href="/generate" className="text-xs text-[#FFB800] hover:underline">Generate one first →</a>
                      </div>
                    )}
                  </>
                )}

                {imageSource === 'upload' && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {uploadImage ? (
                      <div className="relative">
                        <div className="aspect-[3/4] rounded-lg overflow-hidden border-2 border-[#FFB800] bg-white">
                          <img src={uploadImage} alt="Uploaded" className="w-full h-full object-contain" />
                        </div>
                        <button
                          onClick={() => { setUploadImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full aspect-[3/4] border-2 border-dashed border-[#E5E0D5] rounded-lg flex flex-col items-center justify-center gap-2 hover:border-[#FFB800]/50 transition-colors bg-gray-50/50"
                      >
                        <Upload className="w-6 h-6 text-muted-foreground/40" />
                        <span className="text-xs text-muted-foreground">Upload a coloring page</span>
                        <span className="text-[10px] text-muted-foreground/50">PNG, JPG, WEBP</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Choose Palette */}
              <div className="rounded-2xl p-4 shadow-sm border border-border bg-white">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#FF6B6B] text-white text-[10px] flex items-center justify-center font-bold">2</span>
                  Pick a Color Palette
                </h3>
                <div className="space-y-2">
                  {COLOR_PALETTES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedPalette(p.id); setAutoColorImageUrl(null); }}
                      className={cn(
                        "w-full flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all text-left",
                        selectedPalette === p.id
                          ? "border-[#FFB800] bg-[#FFB800]/5 shadow-sm"
                          : "border-[#E5E0D5] hover:border-[#FFB800]/50"
                      )}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex-shrink-0"
                        style={{ background: p.preview }}
                      />
                      <div>
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1">
                          {p.emoji} {p.label}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{p.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Generate */}
              <div className="rounded-2xl p-4 shadow-sm border border-border bg-white">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-gradient-to-r from-[#FFB800] to-[#FF6B6B] text-white text-[10px] flex items-center justify-center font-bold">3</span>
                  Generate
                </h3>

                <div className="text-[10px] text-muted-foreground mb-2">
                  💰 Costs 1 credit · {creditsLeft} remaining
                </div>

                <button
                  onClick={handleAutoColor}
                  disabled={isAutoColoring || !selectedPalette || !sourceImage}
                  className="w-full py-3 rounded-xl font-semibold text-[#1A1A2E] flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 text-sm"
                  style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)', boxShadow: '0 4px 12px rgba(255,107,107,0.3)' }}
                >
                  {isAutoColoring ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Coloring...
                    </>
                  ) : (
                    <>
                      <Paintbrush className="w-4 h-4" />
                      Auto Color
                    </>
                  )}
                </button>

                {autoColorImageUrl && (
                  <button
                    onClick={handleReset}
                    className="w-full mt-2 py-2 rounded-xl border-2 border-[#E5E0D5] text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 hover:border-[#FFB800] transition-all"
                  >
                    ← Try Another Palette
                  </button>
                )}
              </div>
            </div>

            {/* Right Preview */}
            <div className="flex-1 space-y-3">
              <div className="rounded-2xl p-4 shadow-sm border border-border bg-white min-h-[500px] flex items-center justify-center">
                {autoColorImageUrl ? (
                  <div className="text-center w-full">
                    <div className="aspect-[3/4] max-w-[480px] mx-auto rounded-xl overflow-hidden border border-[#E5E0D5] bg-white shadow-sm">
                      <img
                        src={autoColorImageUrl}
                        alt="Auto colored result"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <span className="text-[10px] text-muted-foreground">
                        🎨 Auto colored ({selectedPalette} palette)
                      </span>
                    </div>
                  </div>
                ) : isAutoColoring ? (
                  <div className="text-center">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 mx-auto rounded-full border-4 border-[#FF6B6B]/20 border-t-[#FF6B6B] animate-spin" />
                      <Paintbrush className="w-7 h-7 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#FF6B6B]" />
                    </div>
                    <p className="text-lg font-semibold text-foreground mb-2">AI is coloring your page...</p>
                    <p className="text-sm text-muted-foreground">This usually takes 15-40 seconds</p>
                  </div>
                ) : sourceImage ? (
                  <div className="text-center w-full">
                    <div className="aspect-[3/4] max-w-[480px] mx-auto rounded-xl overflow-hidden border-2 border-dashed border-[#E5E0D5] bg-white">
                      <img
                        src={sourceImage}
                        alt="Selected coloring page"
                        className="w-full h-full object-contain opacity-60"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">Pick a palette and click Auto Color</p>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <div className="relative mb-4">
                      <Palette className="w-16 h-16 mx-auto text-[#FF6B6B]/20" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Paintbrush className="w-6 h-6 text-[#FF6B6B]/40" />
                      </div>
                    </div>
                    <p className="text-lg font-semibold mb-1 text-foreground/60">Your colored page will appear here</p>
                    <p className="text-sm">Select a coloring page and a palette to start</p>
                  </div>
                )}
              </div>

              {autoColorImageUrl && (
                <div className="flex gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-all text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Save Colored
                  </button>
                  <a
                    href={`/color?src=${encodeURIComponent(autoColorImageUrl)}`}
                    className="py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-1.5 text-[#1A1A2E] transition-all hover:-translate-y-0.5 text-sm"
                    style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)', boxShadow: '0 4px 12px rgba(255,107,107,0.3)' }}
                  >
                    <Palette className="w-4 h-4" />
                    Color It!
                  </a>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 text-sm font-medium">{error}</p>
                {(error.includes('credit') || error.includes('limit')) && (
                  <a href="/pricing" className="text-red-600 underline text-xs hover:text-red-800">View pricing plans →</a>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {showSignIn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowSignIn(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
            <h3 className="font-display text-xl mb-4 text-center text-foreground">Sign in to Auto Color</h3>
            <SignIn routing="hash" />
          </div>
        </div>
      )}
    </>
  );
}

export default function AutoColorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B6B]" />
      </div>
    }>
      <AutoColorContent />
    </Suspense>
  );
}
