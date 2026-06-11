'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Loader2, Download, AlertCircle, Palette, ImageIcon, Upload, Paintbrush, Sparkles, ArrowRight, Check, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, SignIn } from '@clerk/nextjs';

/* ──────────────── Data ──────────────── */

const BASIC_PALETTES = [
  {
    id: 'pastel',
    label: 'Pastel',
    emoji: '🩷',
    desc: 'Ink wash pastels, jade & cherry blossom',
    thumbnail: '/styles/palette-pastel.jpg',
    credits: 2,
  },
  {
    id: 'vivid',
    label: 'Vivid',
    emoji: '🎨',
    desc: 'Dunhuang murals, imperial red & gold',
    thumbnail: '/styles/palette-vivid.jpg',
    credits: 2,
  },
  {
    id: 'muted',
    label: 'Muted',
    emoji: '🌿',
    desc: 'Song celadon, tang sancai, wabi-sabi',
    thumbnail: '/styles/palette-muted.jpg',
    credits: 2,
  },
];

const ART_STYLES = [
  {
    id: 'chubby-doodle',
    label: 'Chubby Doodle',
    emoji: '✏️',
    desc: 'Crayon scribble, messy lines, meme-fun vibe',
    thumbnail: '/styles/art-chubby-doodle.jpg',
    prompt: 'Transform this colored illustration into a chubby doodle style illustration. Use crayon and marker scribble strokes, intentionally messy and wobbly lines, distorted proportions and perspective, colors slightly overflowing the outlines, playful meme-like expressions, hand-drawn spontaneous feel on white paper background',
    credits: 4,
  },
  {
    id: 'pop-art',
    label: 'Pop Art',
    emoji: '🎯',
    desc: 'Halftone dots, bold outlines, 1950s print art',
    thumbnail: '/styles/art-pop-art.jpg',
    prompt: 'Transform this colored illustration into a Pop Art style illustration. Use halftone dot printing texture, thick bold black outlines, limited flat color palette (no gradients), 1950s-60s commercial print aesthetic, Ben-Day dots pattern, grainy paper texture on white background',
    credits: 4,
  },
  {
    id: 'city-pop',
    label: 'City Pop',
    emoji: '🌃',
    desc: '1980s Japanese anime, retro colors, vaporwave',
    thumbnail: '/styles/art-city-pop.jpg',
    prompt: 'Transform this colored illustration into a City Pop style illustration. Use 1980s Japanese anime aesthetic, flat vector art style, high saturation retro color palette, Showa-era nostalgic atmosphere, pastel sky gradient, add handwritten English text elements, dreamy vaporwave mood',
    credits: 4,
  },
  {
    id: 'handwritten-piog',
    label: 'Handwritten Piog',
    emoji: '✍️',
    desc: 'Hand-drawn annotations, Japanese lifestyle, Instagram story vibe',
    thumbnail: '/styles/art-piog.jpg',
    prompt: 'Transform this colored illustration into a Handwritten Piog style illustration. Add white hand-drawn annotation lines and text overlays, Japanese daily life aesthetic, low saturation soft lighting, Instagram story filter feel, light leaks and warm tones, casual lifestyle photography mood with hand-drawn decorative elements',
    credits: 4,
  },
];

const PRODUCTS = [
  {
    id: 'canvas-print',
    label: 'Canvas Print',
    emoji: '🖼️',
    desc: 'Ready-to-hang wall art',
    credits: 0,
    available: true,
  },
  {
    id: 'fridge-magnet',
    label: 'Fridge Magnet',
    emoji: '🧲',
    desc: 'Cute icon with white border & label',
    credits: 2,
    available: false,
  },
  {
    id: 'sticker',
    label: 'Sticker',
    emoji: '📒',
    desc: 'Die-cut sticker with white edge',
    credits: 2,
    available: false,
  },
];

type ImageSource = 'mypages' | 'upload';

/* ──────────────── Step indicator ──────────────── */

function StepIndicator({ current }: { current: number }) {
  const steps = ['Line Art', 'Style', 'Product'];
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
              i + 1 < current
                ? 'bg-green-500 text-white'
                : i + 1 === current
                ? 'bg-gradient-to-r from-[#FFB800] to-[#FF6B6B] text-white shadow-md'
                : 'bg-gray-200 text-gray-400'
            )}
          >
            {i + 1 < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span
            className={cn(
              'text-xs font-medium transition-all',
              i + 1 <= current ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {s}
          </span>
          {i < steps.length - 1 && (
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
          )}
        </div>
      ))}
    </div>
  );
}

/* ──────────────── Main component ──────────────── */

function AutoColorContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const searchParams = useSearchParams();

  /* Step 1 state */
  const [imageSource, setImageSource] = useState<ImageSource>('mypages');
  const [uploadImage, setUploadImage] = useState<string | null>(null);
  const [myPagesIdx, setMyPagesIdx] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<{ url: string; style: string; prompt: string; ts: number }[]>([]);

  /* Step 2 state */
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedStyleType, setSelectedStyleType] = useState<'basic' | 'art' | null>(null);

  /* Results */
  const [autoColorResult, setAutoColorResult] = useState<string | null>(null);
  const [styleResult, setStyleResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Step 3 state */
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  /* Auth / usage */
  const [pagesUsed, setPagesUsed] = useState(0);
  const [pageLimit, setPageLimit] = useState(5);
  const [plan, setPlan] = useState('free');
  const [showSignIn, setShowSignIn] = useState(false);

  /* Collapsible step panels */
  const [stepOpen, setStepOpen] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: false });

  // Support ?src= URL parameter
  useEffect(() => {
    const src = searchParams.get('src');
    if (src) {
      setUploadImage(decodeURIComponent(src));
      setImageSource('upload');
    }
  }, [searchParams]);

  const getSourceImage = (): string | null => {
    if (imageSource === 'upload' && uploadImage) return uploadImage;
    if (imageSource === 'mypages' && history.length > 0) return history[myPagesIdx]?.url || history[0].url;
    return null;
  };

  const sourceImage = getSourceImage();
  const creditsLeft = pageLimit - pagesUsed;

  // Determine current step
  const currentStep = styleResult || autoColorResult ? 3 : sourceImage ? 2 : 1;

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
          setHistory(
            data.records.map((r: any) => ({
              url: r.image_url,
              style: r.style,
              prompt: r.prompt,
              ts: new Date(r.created_at).getTime(),
            }))
          );
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

  /* ──────── Step 2: Apply Style (handles both basic & art) ──────── */

  const handleApplyStyle = async () => {
    if (!isSignedIn) { setShowSignIn(true); return; }
    if (!selectedStyle) { setError('Please select a style'); return; }
    const img = getSourceImage();
    if (!img) { setError('Please select or upload a coloring page first'); return; }

    setIsProcessing(true);
    setError(null);
    setAutoColorResult(null);
    setStyleResult(null);

    try {
      if (selectedStyleType === 'basic') {
        // Basic palette: single auto-color call
        const res = await fetch('/api/auto-color', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: img, palette: selectedStyle }),
        });
        const data = await res.json();
        if (!res.ok || data.status === 'failed') {
          setError(data.error || 'Auto color failed');
          if (data.limit) setPageLimit(data.limit);
          if (data.used !== undefined) setPagesUsed(data.used);
          return;
        }
        if (data.pagesUsed !== undefined) setPagesUsed(data.pagesUsed);
        if (data.limit) setPageLimit(data.limit);
        if (data.plan) setPlan(data.plan);
        setAutoColorResult(data.imageUrl);
      } else if (selectedStyleType === 'art') {
        // Art style: two-step (auto-color with vivid → style-transfer)
        const artStyle = ART_STYLES.find(s => s.id === selectedStyle);
        if (!artStyle) { setError('Invalid style selected'); return; }

        // Step A: auto-color with vivid
        const colorRes = await fetch('/api/auto-color', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: img, palette: 'vivid' }),
        });
        const colorData = await colorRes.json();
        if (!colorRes.ok || colorData.status === 'failed') {
          setError(colorData.error || 'Auto color failed');
          if (colorData.limit) setPageLimit(colorData.limit);
          if (colorData.used !== undefined) setPagesUsed(colorData.used);
          return;
        }
        if (colorData.pagesUsed !== undefined) setPagesUsed(colorData.pagesUsed);
        if (colorData.limit) setPageLimit(colorData.limit);
        if (colorData.plan) setPlan(colorData.plan);

        const coloredUrl = colorData.imageUrl;

        // Step B: style-transfer
        const styleRes = await fetch('/api/style-transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: coloredUrl, stylePrompt: artStyle.prompt, styleId: artStyle.id }),
        });
        const styleData = await styleRes.json();
        if (!styleRes.ok || styleData.status === 'failed') {
          // Still show the colored result even if style fails
          setAutoColorResult(coloredUrl);
          setError(styleData.error || 'Style transfer failed');
          if (styleData.limit) setPageLimit(styleData.limit);
          if (styleData.used !== undefined) setPagesUsed(styleData.used);
          return;
        }
        if (styleData.pagesUsed !== undefined) setPagesUsed(styleData.pagesUsed);
        if (styleData.limit) setPageLimit(styleData.limit);
        if (styleData.plan) setPlan(styleData.plan);

        setAutoColorResult(coloredUrl);
        setStyleResult(styleData.imageUrl);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    const url = styleResult || autoColorResult;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixcraftx-${selectedStyle}-${Date.now()}.png`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setSelectedStyle(null);
    setSelectedStyleType(null);
    setAutoColorResult(null);
    setStyleResult(null);
    setSelectedProduct(null);
    setError(null);
    setStepOpen({ 1: true, 2: false, 3: false });
  };

  const handleSelectStyle = (id: string, type: 'basic' | 'art') => {
    setSelectedStyle(id);
    setSelectedStyleType(type);
    setAutoColorResult(null);
    setStyleResult(null);
    setSelectedProduct(null);
  };

  const handleSelectProduct = (id: string) => {
    setSelectedProduct(id);
  };

  /* ──────── Derived display image ──────── */
  const displayImage = styleResult || autoColorResult || sourceImage;

  const selectedStyleLabel = (() => {
    if (!selectedStyle) return '';
    if (selectedStyleType === 'basic') {
      return BASIC_PALETTES.find(p => p.id === selectedStyle)?.label || '';
    }
    return ART_STYLES.find(s => s.id === selectedStyle)?.label || '';
  })();

  const selectedProductData = PRODUCTS.find(p => p.id === selectedProduct);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-8 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
              ✨ Color & Create
            </h1>
            <p className="text-sm text-muted-foreground">
              Line art → Style → Product — 3 steps to your unique merch
            </p>
          </div>

          {/* Step Indicator */}
          <StepIndicator current={currentStep} />

          {/* Main Layout: Left Panel + Right Preview */}
          <div className="flex flex-col lg:flex-row gap-4 mt-4">

            {/* ──── Left Panel ──── */}
            <div className="w-full lg:w-[340px] flex-shrink-0 space-y-3">

              {/* ── Step 1: Choose Line Art ── */}
              <div
                className="rounded-2xl shadow-sm border border-border overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #FFF8E1 0%, #FFF0E0 50%, #FFE8F0 100%)' }}
              >
                <button
                  className="w-full p-4 flex items-center justify-between"
                  onClick={() => setStepOpen(prev => ({ ...prev, 1: !prev[1] }))}
                >
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <span
                      className={cn(
                        'w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold',
                        sourceImage ? 'bg-green-500' : 'bg-gradient-to-r from-[#FFB800] to-[#FF6B6B]'
                      )}
                    >
                      {sourceImage ? <Check className="w-3 h-3" /> : '1'}
                    </span>
                    Choose Line Art
                  </h3>
                  {stepOpen[1] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {stepOpen[1] && (
                  <div className="px-4 pb-4">
                    {/* My Pages / Upload tabs */}
                    <div className="flex gap-1 mb-3">
                      <button
                        onClick={() => setImageSource('mypages')}
                        className={cn(
                          'flex-1 py-1.5 text-xs font-medium rounded-lg transition-all',
                          imageSource === 'mypages'
                            ? 'bg-[#FFB800] text-[#1A1A2E]'
                            : 'bg-white/60 text-muted-foreground hover:bg-white/80'
                        )}
                      >
                        My Pages
                      </button>
                      <button
                        onClick={() => setImageSource('upload')}
                        className={cn(
                          'flex-1 py-1.5 text-xs font-medium rounded-lg transition-all',
                          imageSource === 'upload'
                            ? 'bg-[#FFB800] text-[#1A1A2E]'
                            : 'bg-white/60 text-muted-foreground hover:bg-white/80'
                        )}
                      >
                        Upload
                      </button>
                    </div>

                    {imageSource === 'mypages' ? (
                      <div>
                        {history.length === 0 ? (
                          <div className="text-center py-4">
                            <ImageIcon className="w-8 h-8 mx-auto mb-1 text-muted-foreground/30" />
                            <p className="text-xs text-muted-foreground">No pages yet</p>
                            <Link href="/generate" className="text-xs text-[#FF6B6B] hover:underline mt-1 inline-block">
                              Generate one →
                            </Link>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-1.5 max-h-[200px] overflow-y-auto">
                            {history.map((h, i) => (
                              <button
                                key={i}
                                onClick={() => setMyPagesIdx(i)}
                                className={cn(
                                  'aspect-square rounded-lg overflow-hidden border-2 transition-all',
                                  myPagesIdx === i ? 'border-[#FFB800]' : 'border-transparent hover:border-[#FFB800]/50'
                                )}
                              >
                                <img src={h.url} alt="" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {uploadImage ? (
                          <div className="relative">
                            <div className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-[#FFB800]">
                              <img src={uploadImage} alt="Uploaded" className="w-full h-full object-contain bg-white" />
                            </div>
                            <button
                              onClick={() => { setUploadImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full aspect-[3/4] border-2 border-dashed border-[#E5E0D5] rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-[#FFB800] transition-all bg-white/40"
                          >
                            <Upload className="w-6 h-6 text-muted-foreground/40" />
                            <span className="text-xs text-muted-foreground">Upload PNG, JPG, WEBP</span>
                            <span className="text-[10px] text-muted-foreground/60">Max 10MB</span>
                          </button>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Step 2: Choose Your Style ── */}
              <div
                className="rounded-2xl shadow-sm border border-border overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #F0F0FF 0%, #F5EEFF 50%, #FFF0F5 100%)' }}
              >
                <button
                  className="w-full p-4 flex items-center justify-between"
                  onClick={() => setStepOpen(prev => ({ ...prev, 2: !prev[2] }))}
                >
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <span
                      className={cn(
                        'w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold',
                        autoColorResult || styleResult
                          ? 'bg-green-500'
                          : sourceImage
                          ? 'bg-gradient-to-r from-[#8B5CF6] to-[#EC4899]'
                          : 'bg-gray-300'
                      )}
                    >
                      {autoColorResult || styleResult ? <Check className="w-3 h-3" /> : '2'}
                    </span>
                    Choose Your Style
                    {!sourceImage && (
                      <span className="text-[10px] font-normal text-muted-foreground ml-1">Select line art first</span>
                    )}
                  </h3>
                  {stepOpen[2] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {stepOpen[2] && (
                  <div className="px-4 pb-4">
                    {!sourceImage && (
                      <div className="text-center py-3 mb-3 bg-white/40 rounded-xl">
                        <p className="text-xs text-muted-foreground">Select a line art above first ✨</p>
                      </div>
                    )}
                    <div className={sourceImage ? '' : 'opacity-40 pointer-events-none'}>
                    {/* Credits info */}
                    {isSignedIn && (
                      <p className="text-[10px] text-muted-foreground mb-2">
                        💰 Costs {selectedStyleType === 'art' ? '4' : '2'} credits · {creditsLeft} remaining
                      </p>
                    )}

                    {/* Unified style list - all 7 styles in same card layout */}
                    <div className="space-y-1.5 mb-3">
                      {[...BASIC_PALETTES.map(p => ({...p, type: 'basic' as const})), ...ART_STYLES.map(s => ({...s, type: 'art' as const}))].map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectStyle(item.id, item.type)}
                          className={cn(
                            'w-full flex items-center gap-2.5 p-2 rounded-xl border-2 transition-all text-left',
                            selectedStyle === item.id && selectedStyleType === item.type
                              ? item.type === 'art'
                                ? 'border-[#8B5CF6] bg-[#8B5CF6]/5 shadow-sm'
                                : 'border-[#FFB800] bg-[#FFB800]/5 shadow-sm'
                              : 'border-[#E5E0D5] hover:border-[#FFB800]/50'
                          )}
                        >
                          <div className="w-11 h-11 rounded-lg flex-shrink-0 overflow-hidden bg-gray-50">
                            <img src={item.thumbnail} alt={item.label} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-foreground flex items-center gap-1">
                              {item.emoji} {item.label}
                              {item.type === 'art' && (
                                <span className="text-[8px] bg-[#8B5CF6]/10 text-[#8B5CF6] px-1 py-0.5 rounded-full">ART</span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">{item.desc}</div>
                          </div>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">{item.credits} cr</span>
                        </button>
                      ))}
                    </div>

                    </div>
                    {/* Apply button */}
                    <button
                      onClick={handleApplyStyle}
                      disabled={isProcessing || !selectedStyle || !sourceImage}
                      className="w-full py-2.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 text-sm"
                      style={{
                        background: selectedStyleType === 'art'
                          ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                          : 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)',
                        boxShadow: selectedStyleType === 'art'
                          ? '0 4px 12px rgba(139,92,246,0.3)'
                          : '0 4px 12px rgba(255,107,107,0.3)',
                      }}
                    >
                      {isProcessing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> {selectedStyleType === 'art' ? 'Creating art...' : 'Coloring...'} </>
                      ) : (
                        <>{selectedStyleType === 'art' ? <><Sparkles className="w-4 h-4" /> Apply Style</> : <><Paintbrush className="w-4 h-4" /> Color It</>}</>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* ── Step 3: Choose Product ── */}
              {(autoColorResult || styleResult) && (
                <div
                  className="rounded-2xl shadow-sm border border-border overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #F0F4FF 50%, #FFF8E1 100%)' }}
                >
                  <button
                    className="w-full p-4 flex items-center justify-between"
                    onClick={() => setStepOpen(prev => ({ ...prev, 3: !prev[3] }))}
                  >
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <span
                        className={cn(
                          'w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold',
                          selectedProduct
                            ? 'bg-green-500'
                            : 'bg-gradient-to-r from-[#10B981] to-[#3B82F6]'
                        )}
                      >
                        {selectedProduct ? <Check className="w-3 h-3" /> : '3'}
                      </span>
                      Choose Product
                    </h3>
                    {stepOpen[3] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  {stepOpen[3] && (
                    <div className="px-4 pb-4">
                      <div className="space-y-2 mb-3">
                        {PRODUCTS.map(p => (
                          <button
                            key={p.id}
                            onClick={() => p.available && handleSelectProduct(p.id)}
                            disabled={!p.available}
                            className={cn(
                              'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left',
                              p.available
                                ? selectedProduct === p.id
                                  ? 'border-[#10B981] bg-[#10B981]/5 shadow-sm'
                                  : 'border-[#E5E0D5] hover:border-[#10B981]/50'
                                : 'border-[#E5E0D5] opacity-60 cursor-not-allowed'
                            )}
                          >
                            <span className="text-2xl">{p.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-foreground flex items-center gap-1">
                                {p.label}
                                {!p.available && (
                                  <span className="text-[9px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">
                                    Soon
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground">{p.desc}</div>
                            </div>
                            <span className="text-[10px] text-muted-foreground flex-shrink-0">
                              {p.credits === 0 ? 'Free' : `${p.credits} cr`}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Download / Action button for product */}
                      {selectedProduct === 'canvas-print' && (
                        <button
                          onClick={handleDownload}
                          className="w-full py-2.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 text-sm"
                          style={{
                            background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
                            boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                          }}
                        >
                          <Download className="w-4 h-4" /> Download Canvas Print
                        </button>
                      )}
                      {selectedProduct && !PRODUCTS.find(p => p.id === selectedProduct)?.available && (
                        <div className="text-center py-2 text-xs text-muted-foreground">
                          🚧 This product is coming soon!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Reset Button */}
              {(autoColorResult || styleResult) && (
                <button
                  onClick={handleReset}
                  className="w-full py-2 rounded-xl border-2 border-[#E5E0D5] text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 hover:border-[#FFB800] transition-all"
                >
                  Start Over
                </button>
              )}
            </div>

            {/* ──── Right Preview ──── */}
            <div className="flex-1 space-y-3">
              <div className="rounded-2xl p-4 shadow-sm border border-border bg-white min-h-[500px] flex items-center justify-center">
                {isProcessing ? (
                  <div className="text-center">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 mx-auto rounded-full border-4 border-[#8B5CF6]/20 border-t-[#8B5CF6] animate-spin" />
                      <Sparkles className="w-7 h-7 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#8B5CF6]" />
                    </div>
                    <p className="text-lg font-semibold text-foreground mb-2">
                      {selectedStyleType === 'art' ? 'AI is creating your artwork...' : 'AI is coloring your page...'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedStyleType === 'art' ? 'Two steps: coloring + style — about 10-30s' : 'This usually takes 5-15 seconds'}
                    </p>
                  </div>
                ) : error ? (
                  <div className="text-center px-4">
                    <div className="relative mb-4">
                      <AlertCircle className="w-12 h-12 mx-auto text-red-400" />
                    </div>
                    <p className="text-red-700 text-sm font-medium mb-2">{error}</p>
                    {(error.includes('credit') || error.includes('limit')) && (
                      <a href="/pricing" className="text-red-600 underline text-xs hover:text-red-800">
                        View pricing plans
                      </a>
                    )}
                  </div>
                ) : styleResult ? (
                  <div className="text-center w-full">
                    <div className="aspect-[3/4] max-w-[480px] mx-auto rounded-xl overflow-hidden border border-[#E5E0D5] bg-white shadow-sm">
                      <img src={styleResult} alt="Styled result" className="w-full h-full object-contain" />
                    </div>
                    <div className="mt-2 text-center">
                      <span className="text-[10px] text-muted-foreground">
                        {selectedStyleLabel} style applied ✨
                      </span>
                    </div>
                  </div>
                ) : autoColorResult ? (
                  <div className="text-center w-full">
                    <div className="aspect-[3/4] max-w-[480px] mx-auto rounded-xl overflow-hidden border border-[#E5E0D5] bg-white shadow-sm">
                      <img src={autoColorResult} alt="Colored result" className="w-full h-full object-contain" />
                    </div>
                    <div className="mt-2 text-center">
                      <span className="text-[10px] text-muted-foreground">
                        {selectedStyleLabel} coloring done — pick a product below! ↓
                      </span>
                    </div>
                  </div>
                ) : sourceImage ? (
                  <div className="text-center w-full">
                    <div className="aspect-[3/4] max-w-[480px] mx-auto rounded-xl overflow-hidden border-2 border-dashed border-[#E5E0D5] bg-white">
                      <img src={sourceImage} alt="Selected coloring page" className="w-full h-full object-contain opacity-60" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      Pick a style and click Color It
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <div className="relative mb-4">
                      <Palette className="w-16 h-16 mx-auto text-[#FF6B6B]/20" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Paintbrush className="w-6 h-6 text-[#FF6B6B]/40" />
                      </div>
                    </div>
                    <p className="text-lg font-semibold mb-1 text-foreground/60">
                      Your creation will appear here
                    </p>
                    <p className="text-sm">
                      Select a coloring page and a style to start
                    </p>
                  </div>
                )}
              </div>

              {/* Quick actions below preview */}
              {(autoColorResult || styleResult) && (
                <div className="flex gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-all text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <Link
                    href={`/color?src=\${encodeURIComponent(styleResult || autoColorResult || '')}`}
                    className="py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-1.5 text-[#1A1A2E] transition-all hover:-translate-y-0.5 text-sm"
                    style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)', boxShadow: '0 4px 12px rgba(255,107,107,0.3)' }}
                  >
                    <Palette className="w-4 h-4" />
                    Color It!
                  </Link>
                </div>
              )}

              {/* Recent Creations */}
              {isSignedIn && history.length > 0 && (
                <div className="rounded-2xl p-3 shadow-sm border border-border bg-white">
                  <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    Recent Creations
                  </h4>
                  <div className="grid grid-cols-4 gap-1.5 max-h-[160px] overflow-y-auto">
                    {history.slice(0, 12).map((h, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (h.style === 'style-transfer' || h.style === 'product-format') {
                            setStyleResult(h.url);
                          } else if (h.style === 'autocolor') {
                            setAutoColorResult(h.url);
                          } else {
                            setUploadImage(h.url);
                            setImageSource('upload');
                          }
                        }}
                        className="aspect-square rounded-lg overflow-hidden border border-[#E5E0D5] hover:border-[#FFB800] transition-all"
                      >
                        <img src={h.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
              ×
            </button>
            <h3 className="font-display text-xl mb-4 text-center text-foreground">
              Sign in to Continue
            </h3>
            <SignIn routing="hash" />
          </div>
        </div>
      )}
    </>
  );
}

export default function AutoColorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF6B6B]" />
        </div>
      }
    >
      <AutoColorContent />
    </Suspense>
  );
}
