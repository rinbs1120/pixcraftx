'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Loader2, Download, AlertCircle, Palette, ImageIcon, Upload, Paintbrush, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, SignIn } from '@clerk/nextjs';

const COLOR_PALETTES = [
  {
    id: 'pastel',
    label: 'Pastel',
    emoji: '🩷',
    desc: 'Ink wash pastels, jade & cherry blossom',
    preview: 'linear-gradient(135deg, #FFB5C2 0%, #C5A3FF 30%, #98D8C8 60%, #FFDAB9 100%)',
  },
  {
    id: 'vivid',
    label: 'Vivid',
    emoji: '🎨',
    desc: 'Dunhuang murals, imperial red & gold',
    preview: 'linear-gradient(135deg, #FF3366 0%, #FFCC00 33%, #00CCFF 66%, #FF6600 100%)',
  },
  {
    id: 'muted',
    label: 'Muted',
    emoji: '🌿',
    desc: 'Song celadon, tang sancai, wabi-sabi',
    preview: 'linear-gradient(135deg, #A8B5A2 0%, #C4A882 33%, #C9A0A0 66%, #D4C5A9 100%)',
  },
];

const ARTISTIC_STYLES = [
  {
    id: 'chubby-doodle',
    label: 'Chubby Doodle',
    desc: 'Calligraphy brush + lucky cat + rice paper + seal stamp',
    thumbnail: '/styles/art-chubby-doodle.jpg',
    prompt: 'Transform this coloring page into an Oriental chubby doodle style illustration. Use crayon and marker scribble strokes with Chinese calligraphy brush texture, intentionally messy and wobbly lines, distorted cute proportions with chibi-style round faces, warm red and gold accent colors slightly overflowing the outlines, playful lucky cat expressions, hand-drawn spontaneous feel on rice paper textured background, tiny seal stamp mark in corner',
    strength: 0.85,
  },
  {
    id: 'pop-art',
    label: 'Pop Art',
    desc: 'Woodblock print + vermillion/indigo/gold + cloud motifs + New Year poster',
    thumbnail: '/styles/art-pop-art.jpg',
    prompt: 'Transform this coloring page into an Oriental Pop Art style illustration inspired by Chinese woodblock print aesthetics. Use halftone dot printing texture mixed with traditional woodcut grain patterns, thick bold black outlines like ink brush strokes, limited flat color palette of vermillion red indigo blue and gold (no gradients), vintage Chinese propaganda poster aesthetic, Ben-Day dots pattern with cloud and wave motifs, aged paper texture on cream background',
    strength: 0.85,
  },
  {
    id: 'city-pop',
    label: 'City Pop',
    desc: 'HK neon + lantern glow + pagoda silhouette + brush calligraphy',
    thumbnail: '/styles/art-city-pop.jpg',
    prompt: 'Transform this coloring page into an Oriental City Pop style illustration blending 1980s Hong Kong neon aesthetic with Japanese anime. Flat vector art style, high saturation retro color palette of neon pink cyan and gold, Showa-era nostalgic atmosphere with Chinese lantern glow, pastel sunset gradient sky over pagoda silhouettes, add handwritten bilingual text elements in brush calligraphy style, dreamy vaporwave mood with cherry blossom petals floating',
    strength: 0.85,
  },
  {
    id: 'fridge-magnet',
    label: 'Fridge Magnet',
    desc: 'Paper-cut + lucky mascot + embossed relief + red/gold border + seal stamp',
    thumbnail: '/styles/art-fridge-magnet.jpg',
    prompt: 'Transform this coloring page into an Oriental fridge magnet style illustration inspired by Chinese paper-cut art and lucky mascots. Extract the main subject as a minimalist icon design with paper-cut silhouette edges, slight 3D depth with embossed relief effect, clean red and gold border outline around the shape, add a small Chinese seal stamp below the icon, flat bold vermillion and gold colors, white background, auspicious and cute aesthetic',
    strength: 0.9,
  },
  {
    id: 'handwritten-piog',
    label: 'Handwritten Piog',
    desc: 'Calligraphy annotation + tea set + paper window light + wabi-sabi + seal stamp',
    thumbnail: '/styles/art-piog.jpg',
    prompt: 'Transform this coloring page into an Oriental Handwritten Piog style illustration blending Chinese calligraphy annotations with lifestyle photography. Add white hand-drawn annotation lines and brush calligraphy text overlays in both Chinese and English, traditional Chinese daily life aesthetic with tea sets and scrolls, low saturation soft warm lighting like afternoon sun through paper windows, light leaks with golden dust particles, casual wabi-sabi lifestyle mood with hand-drawn cloud and flower decorative elements, small red seal stamp marks',
    strength: 0.8,
  },
];

type ImageSource = 'mypages' | 'upload';
type Mode = 'palette' | 'artstyle';

function AutoColorContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const searchParams = useSearchParams();

  const [imageSource, setImageSource] = useState<ImageSource>('mypages');
  const [uploadImage, setUploadImage] = useState<string | null>(null);
  const [myPagesIdx, setMyPagesIdx] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<{ url: string; style: string; prompt: string; ts: number }[]>([]);

  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);
  const [selectedArtStyle, setSelectedArtStyle] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('palette');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pagesUsed, setPagesUsed] = useState(0);
  const [pageLimit, setPageLimit] = useState(5);
  const [plan, setPlan] = useState('free');
  const [showSignIn, setShowSignIn] = useState(false);

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

    setIsProcessing(true);
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

      setResultImageUrl(data.imageUrl);
      if (data.pagesUsed !== undefined) setPagesUsed(data.pagesUsed);
      if (data.limit) setPageLimit(data.limit);
      if (data.plan) setPlan(data.plan);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStyleTransfer = async () => {
    if (!isSignedIn) { setShowSignIn(true); return; }
    if (!selectedArtStyle) { setError('Please select an art style'); return; }

    const sourceImage = getSourceImage();
    if (!sourceImage) { setError('Please select or upload a coloring page first'); return; }

    const styleObj = ARTISTIC_STYLES.find(s => s.id === selectedArtStyle);
    if (!styleObj) return;

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/style-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: sourceImage,
          styleId: selectedArtStyle,
          stylePrompt: styleObj.prompt,
          strength: styleObj.strength,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Style transfer failed');
        if (data.limit) setPageLimit(data.limit);
        if (data.used !== undefined) setPagesUsed(data.used);
        return;
      }

      setResultImageUrl(data.imageUrl);
      if (data.pagesUsed !== undefined) setPagesUsed(data.pagesUsed);
      if (data.limit) setPageLimit(data.limit);
      if (data.plan) setPlan(data.plan);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerate = () => {
    if (mode === 'palette') {
      handleAutoColor();
    } else {
      handleStyleTransfer();
    }
  };

  const handleReset = () => {
    setResultImageUrl(null);
    setSelectedPalette(null);
    setSelectedArtStyle(null);
    setError(null);
  };

  const handleDownload = () => {
    if (!resultImageUrl) return;
    const suffix = mode === 'artstyle' ? `styled-${selectedArtStyle}` : `autocolor-${selectedPalette}`;
    const a = document.createElement('a');
    a.href = resultImageUrl;
    a.download = `pixcraftx-${suffix}-${Date.now()}.png`;
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
              Color & Style
            </h1>
            <p className="text-muted-foreground">
              Pick a coloring page, then choose Auto Color or an art style
            </p>
          </div>

          <div className="flex gap-6">

            {/* Left Panel */}
            <div className="w-[340px] flex-shrink-0 space-y-4">

              {/* Step 1: Choose Image */}
              <div className="rounded-2xl p-4 shadow-sm border border-border" style={{ background: 'linear-gradient(135deg, #FFFBF0 0%, #FFF5E6 50%, #FFEFF5 100%)' }}>
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

              {/* Step 2: Color Palette / Art Style Tabs */}
              <div className="rounded-2xl p-4 shadow-sm border border-border" style={{ background: 'linear-gradient(135deg, #FFFBF0 0%, #FFF5E6 50%, #FFEFF5 100%)' }}>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#FF6B6B] text-white text-[10px] flex items-center justify-center font-bold">2</span>
                  Choose Color or Style
                </h3>

                {/* Tab Switcher */}
                <div className="flex gap-1 mb-3 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => { setMode('palette'); setSelectedArtStyle(null); setResultImageUrl(null); }}
                    className={cn(
                      "flex-1 py-1.5 rounded-md text-xs font-semibold transition-all",
                      mode === 'palette' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    🎨 Color Palette
                  </button>
                  <button
                    onClick={() => { setMode('artstyle'); setSelectedPalette(null); setResultImageUrl(null); }}
                    className={cn(
                      "flex-1 py-1.5 rounded-md text-xs font-semibold transition-all",
                      mode === 'artstyle' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    ✨ Art Style
                  </button>
                </div>

                {/* Tab Content: Color Palette */}
                {mode === 'palette' && (
                  <div className="space-y-2">
                    {COLOR_PALETTES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedPalette(p.id); setResultImageUrl(null); }}
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
                )}

                {/* Tab Content: Art Style */}
                {mode === 'artstyle' && (
                  <div className="grid grid-cols-3 gap-2">
                    {ARTISTIC_STYLES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { setSelectedArtStyle(s.id); setResultImageUrl(null); }}
                        className={cn(
                          "rounded-xl border-2 overflow-hidden transition-all text-left",
                          selectedArtStyle === s.id
                            ? "border-[#FFB800] shadow-sm"
                            : "border-[#E5E0D5] hover:border-[#FFB800]/50"
                        )}
                      >
                        <div className="aspect-square bg-gray-100">
                          <img src={s.thumbnail} alt={s.label} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-1.5">
                          <div className="text-[10px] font-semibold text-foreground truncate">{s.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 3: Generate */}
              <div className="rounded-2xl p-4 shadow-sm border border-border" style={{ background: 'linear-gradient(135deg, #FFFBF0 0%, #FFF5E6 50%, #FFEFF5 100%)' }}>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-gradient-to-r from-[#FFB800] to-[#FF6B6B] text-white text-[10px] flex items-center justify-center font-bold">3</span>
                  Generate
                </h3>

                <div className="text-[10px] text-muted-foreground mb-2">
                  💰 Costs {mode === 'palette' ? '2' : '3'} credits · {creditsLeft} remaining
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isProcessing || (mode === 'palette' ? !selectedPalette : !selectedArtStyle) || !sourceImage}
                  className="w-full py-3 rounded-xl font-semibold text-[#1A1A2E] flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 text-sm"
                  style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)', boxShadow: '0 4px 12px rgba(255,107,107,0.3)' }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {mode === 'palette' ? 'Coloring...' : 'Styling...'}
                    </>
                  ) : (
                    <>
                      {mode === 'palette' ? <Paintbrush className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                      {mode === 'palette' ? 'Auto Color' : 'Apply Style'}
                    </>
                  )}
                </button>

                {resultImageUrl && (
                  <button
                    onClick={handleReset}
                    className="w-full mt-2 py-2 rounded-xl border-2 border-[#E5E0D5] text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 hover:border-[#FFB800] transition-all"
                  >
                    ← Try Another
                  </button>
                )}
              </div>
            </div>

            {/* Right Preview */}
            <div className="flex-1 space-y-3">
              <div className="rounded-2xl p-4 shadow-sm border border-border bg-white min-h-[500px] flex items-center justify-center">
                {resultImageUrl ? (
                  <div className="text-center w-full">
                    <div className="aspect-[3/4] max-w-[480px] mx-auto rounded-xl overflow-hidden border border-[#E5E0D5] bg-white shadow-sm">
                      <img
                        src={resultImageUrl}
                        alt="Result"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <span className="text-[10px] text-muted-foreground">
                        {mode === 'palette'
                          ? `🎨 Auto colored (${selectedPalette} palette)`
                          : `✨ ${ARTISTIC_STYLES.find(s => s.id === selectedArtStyle)?.label} style applied`}
                      </span>
                    </div>
                  </div>
                ) : isProcessing ? (
                  <div className="text-center">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 mx-auto rounded-full border-4 border-[#FF6B6B]/20 border-t-[#FF6B6B] animate-spin" />
                      <Paintbrush className="w-7 h-7 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#FF6B6B]" />
                    </div>
                    <p className="text-lg font-semibold text-foreground mb-2">
                      {mode === 'palette' ? 'AI is coloring your page...' : 'Applying art style...'}
                    </p>
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
                    <p className="text-sm text-muted-foreground mt-3">
                      {mode === 'palette' ? 'Pick a palette and click Auto Color' : 'Pick a style and click Apply Style'}
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
                    <p className="text-lg font-semibold mb-1 text-foreground/60">Your colored page will appear here</p>
                    <p className="text-sm">Select a coloring page and a palette or style to start</p>
                  </div>
                )}
              </div>

              {resultImageUrl && (
                <div className="flex gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-all text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <Link
                    href={`/color?src=${encodeURIComponent(resultImageUrl)}`}
                    className="py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-1.5 text-[#1A1A2E] transition-all hover:-translate-y-0.5 text-sm"
                    style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)', boxShadow: '0 4px 12px rgba(255,107,107,0.3)' }}
                  >
                    <Palette className="w-4 h-4" />
                    Color It!
                  </Link>
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
            <h3 className="font-display text-xl mb-4 text-center text-foreground">Sign in to Continue</h3>
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
