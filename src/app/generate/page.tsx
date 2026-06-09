'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Sparkles, Loader2, Download, RotateCcw, AlertCircle, Palette, ImageIcon, Wand2, Plus, FileText, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, SignIn } from '@clerk/nextjs';
import { downloadPDF, canExportPDF } from '@/lib/download-utils';



const styles = [
  {
    id: 'simple' as const,
    label: 'Simple',
    emoji: '✏️',
    desc: 'Bold outlines, big areas',
    thumbnail: '/styles/simple-preview.jpg',
  },
  {
    id: 'mandala' as const,
    label: 'Mandala',
    emoji: '🔮',
    desc: 'Symmetrical patterns',
    thumbnail: '/styles/mandala-preview.jpg',
  },
  {
    id: 'intricate' as const,
    label: 'Intricate',
    emoji: '🎨',
    desc: 'Fine details, rich scenes',
    thumbnail: '/styles/intricate-preview.jpg',
  },
];


const ARTISTIC_STYLES = [
  {
    id: 'chubby-doodle',
    label: 'Chubby Doodle',
    desc: 'Crayon marker scribble style, messy lines, distorted proportions, coloring overflow, meme-fun vibe',
    thumbnail: '/styles/art-chubby-doodle.jpg',
    prompt: 'Transform this coloring page into a chubby doodle style illustration. Use crayon and marker scribble strokes, intentionally messy and wobbly lines, distorted proportions and perspective, colors slightly overflowing the outlines, playful meme-like expressions, hand-drawn spontaneous feel on white paper background',
  },
  {
    id: 'pop-art',
    label: 'Pop Art',
    desc: 'Halftone dots, bold outlines, limited color palette, 1950s print art, grainy paper texture',
    thumbnail: '/styles/art-pop-art.jpg',
    prompt: 'Transform this coloring page into a Pop Art style illustration. Use halftone dot printing texture, thick bold black outlines, limited flat color palette (no gradients), 1950s-60s commercial print aesthetic, Ben-Day dots pattern, grainy paper texture on white background',
  },
  {
    id: 'city-pop',
    label: 'City Pop',
    desc: '1980s Japanese anime aesthetic, flat vector, high saturation retro colors, Showa nostalgia',
    thumbnail: '/styles/art-city-pop.jpg',
    prompt: 'Transform this coloring page into a City Pop style illustration. Use 1980s Japanese anime aesthetic, flat vector art style, high saturation retro color palette, Showa-era nostalgic atmosphere, pastel sky gradient, add handwritten English text elements, dreamy vaporwave mood',
  },
  {
    id: 'fridge-magnet',
    label: 'Fridge Magnet',
    desc: 'Minimalist icon design, slight 3D shadow, white border outline, handwritten English label',
    thumbnail: '/styles/art-fridge-magnet.jpg',
    prompt: 'Transform this coloring page into a fridge magnet style illustration. Extract the main subject as a minimalist icon design, slight 3D depth with drop shadow, clean white border outline around the shape, add handwritten English text label below the icon, flat bold colors, white background, cute and clean aesthetic',
  },
  {
    id: 'handwritten-piog',
    label: 'Handwritten Piog',
    desc: 'White hand-drawn annotations, Japanese lifestyle feel, low saturation soft light, Instagram story vibe',
    thumbnail: '/styles/art-piog.jpg',
    prompt: 'Transform this coloring page into a Handwritten Piog style illustration. Add white hand-drawn annotation lines and text overlays, Japanese daily life aesthetic, low saturation soft lighting, Instagram story filter feel, light leaks and warm tones, casual lifestyle photography mood with hand-drawn decorative elements',
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
  const [dlOpen, setDlOpen] = useState(false)
  const [plan, setPlan] = useState('free');
  const [showSignIn, setShowSignIn] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceFileName, setReferenceFileName] = useState<string>('');
  const [refTrialUsed, setRefTrialUsed] = useState(false);
  const [history, setHistory] = useState<{url: string; style: string; prompt: string; ts: number}[]>([]);
  const [styledImageUrl, setStyledImageUrl] = useState<string | null>(null);
  const [selectedArtStyle, setSelectedArtStyle] = useState<string | null>(null);
  const [isStyling, setIsStyling] = useState(false);

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
        if (data.refTrialUsed !== undefined) setRefTrialUsed(data.refTrialUsed);
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



  const handleStyleTransfer = async (artStyle: typeof ARTISTIC_STYLES[0]) => {
    if (!generatedImageUrl) return;
    if (!isSignedIn) { setShowSignIn(true); return; }
    setSelectedArtStyle(artStyle.id);
    setIsStyling(true);
    setStyledImageUrl(null);
    try {
      const response = await fetch('/api/style-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          stylePrompt: artStyle.prompt,
          styleId: artStyle.id,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Style transfer failed. Please try again.');
        return;
      }
      if (data.status === 'processing' && data.requestId) {
        const maxAttempts = 30;
        for (let i = 0; i < maxAttempts; i++) {
          await new Promise(r => setTimeout(r, 3000));
          try {
            const statusRes = await fetch('/api/style-transfer?requestId=' + data.requestId);
            const statusData = await statusRes.json();
            if (statusData.status === 'completed') {
              setStyledImageUrl(statusData.imageUrl);
              break;
            } else if (statusData.status === 'failed') {
              setError(statusData.error || 'Style transfer failed.');
              break;
            }
          } catch { /* retry */ }
        }
      } else {
        setStyledImageUrl(data.imageUrl);
      }
    } catch {
      setError('Network error during style transfer.');
    } finally {
      setIsStyling(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!isSignedIn) { setShowSignIn(true); return; }

    // Check if reference image needs credits and user has enough
    if (referenceImage && refTrialUsed) {
      const totalNeeded = 1 + 5; // 1 base credit + 5 reference surcharge
      const remaining = pageLimit - pagesUsed;
      if (remaining < totalNeeded) {
        setShowUpgradeModal(true);
        return;
      }
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

      if (data.status === 'processing' && data.requestId) {
        setPagesUsed(data.pagesUsed);
        setPageLimit(data.limit);
        setPlan(data.plan);
        if (data.refTrialApplied) setRefTrialUsed(true);
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
              setHistory(prev => [{url: statusData.imageUrl, style: selectedStyle, prompt: prompt.trim(), ts: Date.now()}, ...prev].slice(0, 20));
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
        setHistory(prev => [{url: data.imageUrl, style: selectedStyle, prompt: prompt.trim(), ts: Date.now()}, ...prev].slice(0, 20));
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
      if (plan !== 'free') {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pixcraftx-${selectedStyle}-${Date.now()}.png`;
        document.body.appendChild(a); a.click();
        window.URL.revokeObjectURL(url); document.body.removeChild(a);
      } else {
        const img = new Image(); img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve(); img.onerror = () => reject();
          img.src = URL.createObjectURL(blob);
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        ctx.save();
        const fontSize = Math.max(16, Math.floor(canvas.width / 25));
        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const text = 'PixCraftX';
        const textWidth = ctx.measureText(text).width;
        const stepX = textWidth + 60; const stepY = fontSize * 4;
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.rotate(-Math.PI/6);
        for (let y = -canvas.height; y < canvas.height; y += stepY) {
          for (let x = -canvas.width; x < canvas.width; x += stepX) {
            ctx.fillText(text, x, y);
          }
        }
        ctx.restore();
        canvas.toBlob((wBlob) => {
          if (!wBlob) return;
          const url = URL.createObjectURL(wBlob);
          const a = document.createElement('a');
          a.download = `pixcraftx-${selectedStyle}-${Date.now()}.png`;
          a.href = url; a.click(); URL.revokeObjectURL(url);
        }, 'image/png');
        URL.revokeObjectURL(img.src);
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleDownloadPDF = async () => {
    if (!generatedImageUrl) return;
    try {
      await downloadPDF(generatedImageUrl, `pixcraftx-${selectedStyle}-${Date.now()}`);
    } catch (err) {
      console.error('PDF download failed:', err);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-8 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          
          {/* Page Title */}
          <div className="text-center mb-4">
            <h1 className="font-display text-2xl md:text-3xl text-foreground">
              Create Your Coloring Page
            </h1>
          </div>

          {/* ====== TOP: Compact Input Area ====== */}
          <div className="rounded-2xl p-4 md:p-5 shadow-sm border border-border mb-6" style={{ background: 'linear-gradient(135deg, #FFFBF0 0%, #FFF5E6 50%, #FFEFF5 100%)' }}>
            {/* Input row: Textarea only */}
            <div className="relative">
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
                rows={3}
                className="w-full px-4 py-3 text-sm bg-white border-2 border-[#E5E0D5] rounded-xl focus:border-[#FFB800] focus:ring-2 focus:ring-[#FFB800]/20 outline-none transition-all resize-none text-foreground placeholder:text-muted-foreground pr-12"
              />
              {/* Bottom-left: upload button inside textarea - larger and visible */}
              <div className="absolute left-3 bottom-2.5 flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center transition-all border-2",
                    referenceImage 
                      ? "border-[#FFB800] bg-[#FFB800]/10 text-[#FFB800]" 
                      : "border-dashed border-[#C8C0B4] text-muted-foreground/60 hover:border-[#FFB800] hover:text-[#FFB800] hover:bg-[#FFB800]/5"
                  )}
                  title={refTrialUsed ? "Upload reference image (5 credits)" : "Upload reference image (Free trial!)"}
                >
                  <Plus className="w-5 h-5" />
                </button>
                {referenceImage && (
                  <div className="relative">
                    <img
                      src={referenceImage}
                      alt="Ref"
                      className="w-9 h-9 object-cover rounded-lg border-2 border-[#FFB800]"
                    />
                    <button
                      onClick={removeReference}
                      className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[8px] hover:bg-red-600 shadow-sm"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              {/* Bottom-right: char count */}
              <span className="absolute right-3 bottom-2 text-[10px] text-muted-foreground/50">
                {prompt.length > 0 ? `${prompt.length}/500` : ''}
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

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

            {/* Style toggle + Generate button */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E5E0D5]/50">
              <div className="flex gap-2">
                {styles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    disabled={!!referenceImage}
                    className={cn(
                      "relative rounded-xl overflow-hidden transition-all border-2 flex flex-col items-center",
                      selectedStyle === style.id && !referenceImage
                        ? "border-[#FFB800] ring-2 ring-[#FFB800]/20 shadow-md"
                        : "border-[#E5E0D5] hover:border-[#FFB800]/50 hover:shadow-sm",
                      referenceImage && "opacity-40 cursor-not-allowed"
                    )}
                    title={style.desc}
                  >
                    <img
                      src={style.thumbnail}
                      alt={style.label}
                      className="w-14 h-[18px] object-cover object-top"
                    />
                    <span className="text-[10px] font-semibold py-0.5 px-1 whitespace-nowrap text-foreground/80">{style.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || prompt.length > 500}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-[#FFB800] to-[#FF6B6B] text-white font-semibold text-sm flex items-center gap-1.5 shadow-[0_2px_8px_rgba(255,107,107,0.3)] hover:shadow-[0_4px_16px_rgba(255,107,107,0.4)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate
              </button>
            </div>

            {/* Hint line */}
            <div className="flex items-center justify-between mt-2 px-0.5">
              <p className="text-[10px] text-muted-foreground">
                {referenceImage 
                  ? (refTrialUsed ? '📎 Reference mode (5 credits)' : '🎁 Reference mode (Free trial!)')
                  : `${styles.find(s => s.id === selectedStyle)?.emoji} ${styles.find(s => s.id === selectedStyle)?.label} style`}
                {!isSignedIn && isLoaded && (
                  <>
                    {' · '}
                    <button 
                      onClick={() => setShowSignIn(true)}
                      className="text-[#FFB800] hover:underline font-semibold"
                    >
                      Sign in for 2 free credits
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
                    className="py-3 px-5 rounded-xl border-2 border-[#E5E0D5] text-foreground flex items-center justify-center gap-2 hover:border-[#FFB800] transition-all disabled:opacity-50"
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
                  <div className="relative">
                    <button
                      onClick={() => { if (canExportPDF(plan)) { setDlOpen(!dlOpen); } else { handleDownload(); } }}
                      className="py-3 px-5 rounded-xl bg-[#1A1A2E] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#1A1A2E]/90 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Download
                      {canExportPDF(plan) && <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {dlOpen && canExportPDF(plan) && (
                      <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[120px] z-50">
                        <button onClick={() => { setDlOpen(false); handleDownload(); }} className="w-full px-4 py-2.5 text-sm text-left hover:bg-amber-50 flex items-center gap-2 text-[#1A1A2E]">
                          <Download className="w-3.5 h-3.5" /> PNG
                        </button>
                        <button onClick={() => { setDlOpen(false); handleDownloadPDF(); }} className="w-full px-4 py-2.5 text-sm text-left hover:bg-amber-50 flex items-center gap-2 text-[#FFB800]">
                          <FileText className="w-3.5 h-3.5" /> PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Style Transfer Section */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Wand2 className="w-4 h-4 text-[#FFB800]" />
                    <span className="text-sm font-semibold text-foreground">Style It</span>
                    <span className="text-[10px] text-muted-foreground">Transform into artwork</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {ARTISTIC_STYLES.map((art) => (
                      <button
                        key={art.id}
                        onClick={() => handleStyleTransfer(art)}
                        disabled={isStyling}
                        className={cn(
                          "flex-shrink-0 rounded-xl overflow-hidden transition-all border-2",
                          selectedArtStyle === art.id
                            ? "border-[#FFB800] ring-2 ring-[#FFB800]/20 shadow-md"
                            : "border-[#E5E0D5] hover:border-[#FFB800]/50 hover:shadow-sm",
                          isStyling && selectedArtStyle !== art.id && "opacity-40"
                        )}
                        title={art.desc}
                      >
                        <div className="w-16 h-10 bg-gradient-to-br from-purple-100 via-pink-100 to-amber-100 flex items-center justify-center text-lg">
                          {art.id === 'chubby-doodle' ? '🖍️' : art.id === 'pop-art' ? '💥' : art.id === 'city-pop' ? '🌆' : art.id === 'fridge-magnet' ? '🧲' : '✏️'}
                        </div>
                        <div className="px-1.5 py-1 text-center">
                          <span className="text-[9px] font-semibold text-foreground/80 leading-tight block">{art.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {isStyling && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin text-[#FFB800]" />
                      <span>Applying {ARTISTIC_STYLES.find(s => s.id === selectedArtStyle)?.label} style...</span>
                    </div>
                  )}
                  {styledImageUrl && (
                    <div className="mt-3 bg-card rounded-2xl p-3 border border-border">
                      <img
                        src={styledImageUrl}
                        alt="Styled artwork"
                        className="w-full h-auto object-contain rounded-xl"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = styledImageUrl;
                            a.download = 'pixcraftx-styled-' + selectedArtStyle + '-' + Date.now() + '.png';
                            a.click();
                          }}
                          className="flex-1 py-2 rounded-xl bg-[#1A1A2E] text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-[#1A1A2E]/90"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                        <button
                          onClick={() => { setStyledImageUrl(null); setSelectedArtStyle(null); }}
                          className="py-2 px-4 rounded-xl border-2 border-[#E5E0D5] text-sm hover:border-[#FFB800]"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  )}
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

          {/* Generation History */}
          {history.length > 1 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Recent Generations</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {history.slice(1).map((item, i) => (
                  <button
                    key={item.ts}
                    onClick={() => { setGeneratedImageUrl(item.url); setSelectedStyle(item.style as any); }}
                    className="flex-shrink-0 w-16 h-[86px] rounded-lg overflow-hidden border-2 border-[#E5E0D5] hover:border-[#FFB800] transition-all"
                    title={item.prompt}
                  >
                    <img src={item.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

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

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FFB800]/10 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-[#FFB800]" />
              </div>
              <h3 className="font-display text-xl mb-2 text-foreground">More Credits Needed</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Reference image mode uses 5 extra credits on top of 1 base credit.
                You have <strong>{pageLimit - pagesUsed}</strong> credit{pageLimit - pagesUsed !== 1 ? 's' : ''} remaining, but need <strong>6</strong>.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-[#1A1A2E] transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)', boxShadow: '0 4px 12px rgba(255,107,107,0.3)' }}
              >
                View Plans
              </Link>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="block mx-auto mt-3 text-sm text-muted-foreground hover:text-foreground"
              >
                Maybe Later
              </button>
            </div>
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
