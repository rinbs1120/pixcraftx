'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Sparkles, Loader2, Download, RotateCcw, AlertCircle, Palette, ImageIcon, Wand2, FileText, ChevronDown, Upload, Clock, Paintbrush } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, SignIn } from '@clerk/nextjs';
import { downloadPDF, canExportPDF } from '@/lib/download-utils';



const styles = [
  {
    id: 'simple' as const,
    label: 'Simple',
    emoji: '✏️',
    desc: 'Bold outlines, big areas',
    thumbnail: '/styles/simple.jpg',
  },
  {
    id: 'mandala' as const,
    label: 'Mandala',
    emoji: '🔮',
    desc: 'Symmetrical patterns',
    thumbnail: '/styles/mandala.jpg',
  },
  {
    id: 'intricate' as const,
    label: 'Intricate',
    emoji: '🎨',
    desc: 'Fine details, rich scenes',
    thumbnail: '/styles/intricate.jpg',
  },
];


const EXAMPLE_PROMPTS = [
  { emoji: '🐲', text: 'Chinese dragon soaring through clouds' },
  { emoji: '🏯', text: 'Pagoda temple on misty mountain' },
  { emoji: '🦋', text: 'Butterfly on peony flowers' },
  { emoji: '🐾', text: 'Cute panda eating bamboo' },
  { emoji: '🌊', text: 'Koi fish swimming in lotus pond' },
  { emoji: '🌸', text: 'Cherry blossom branch with lanterns' },
  { emoji: '🧑', text: 'Girl in hanfu under moonlight' },
  { emoji: '🐱', text: 'Lucky cat with gold coins' },
  { emoji: '🏔', text: 'Phoenix rising over volcano' },
  { emoji: '🎠', text: 'Carp leaping over dragon gate' },
  { emoji: '🧀', text: 'Jade rabbit on the moon' },
  { emoji: '🏰', text: 'Floating island with fairy palace' },
  { emoji: '🐟', text: 'Underwater dragon palace' },
  { emoji: '🌻', text: 'Sunflower field with windmill' },
  { emoji: '🐢', text: 'Baby turtle on tropical beach' },
  { emoji: '🦉', text: 'Owl in enchanted forest' },
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
  const [dlOpen, setDlOpen] = useState(false);
  const [plan, setPlan] = useState('free');
  const [showSignIn, setShowSignIn] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceFileName, setReferenceFileName] = useState<string>('');
  const [refTrialUsed, setRefTrialUsed] = useState(false);
  const [history, setHistory] = useState<{url: string; style: string; prompt: string; ts: number}[]>([]);

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

  // Load history from DB (persistent across page navigations)
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

    if (referenceImage && refTrialUsed) {
      const totalNeeded = 1 + 5;
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
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">

          <div className="flex gap-6">

            {/* Left Panel */}
            <div className="w-[340px] flex-shrink-0 space-y-4">

              {/* Describe Section */}
              <div className="rounded-2xl p-4 shadow-sm border border-border" style={{ background: 'linear-gradient(135deg, #FFFBF0 0%, #FFF5E6 50%, #FFEFF5 100%)' }}>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#FFB800] text-white text-[10px] flex items-center justify-center font-bold">1</span>
                  Describe
                </h3>

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Chinese dragon soaring through clouds..."
                  className="w-full p-3 rounded-xl border-2 border-[#E5E0D5] bg-white text-sm resize-none focus:outline-none focus:border-[#FFB800] transition-colors min-h-[80px]"
                  rows={3}
                />

                {/* Example Prompts */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {EXAMPLE_PROMPTS.slice(0, 4).map((ex) => (
                    <button
                      key={ex.text}
                      onClick={() => setPrompt(ex.text)}
                      className="text-[10px] px-2 py-1 rounded-full bg-white border border-[#E5E0D5] hover:border-[#FFB800] transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {ex.emoji} {ex.text.split(' ').slice(0, 3).join(' ')}...
                    </button>
                  ))}
                </div>

                {/* Reference Image */}
                <div className="mt-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {referenceImage ? (
                    <div className="relative">
                      <div className="aspect-[4/3] rounded-lg overflow-hidden border-2 border-[#FFB800] bg-white">
                        <img src={referenceImage} alt="Reference" className="w-full h-full object-contain" />
                      </div>
                      <button
                        onClick={removeReference}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-600"
                      >
                        ✕
                      </button>
                      <p className="text-[10px] text-muted-foreground mt-1">{referenceFileName}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 rounded-lg border-2 border-dashed border-[#E5E0D5] flex items-center justify-center gap-1.5 hover:border-[#FFB800]/50 transition-colors text-xs text-muted-foreground"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload reference photo
                    </button>
                  )}
                </div>
              </div>

              {/* Line Style Section */}
              <div className="rounded-2xl p-4 shadow-sm border border-border" style={{ background: 'linear-gradient(135deg, #FFFBF0 0%, #FFF5E6 50%, #FFEFF5 100%)' }}>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#FF6B6B] text-white text-[10px] flex items-center justify-center font-bold">2</span>
                  Line Style
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  {styles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={cn(
                        "rounded-xl border-2 overflow-hidden transition-all",
                        selectedStyle === style.id
                          ? "border-[#FFB800] shadow-sm"
                          : "border-[#E5E0D5] hover:border-[#FFB800]/50"
                      )}
                    >
                      <div className="aspect-[3/4] bg-gray-100">
                        <img src={style.thumbnail} alt={style.label} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-1.5 text-center">
                        <div className="text-[10px] font-semibold text-foreground">{style.emoji} {style.label}</div>
                        <div className="text-[8px] text-muted-foreground">{style.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="rounded-2xl p-4 shadow-sm border border-border" style={{ background: 'linear-gradient(135deg, #FFFBF0 0%, #FFF5E6 50%, #FFEFF5 100%)' }}>
                <div className="text-[10px] text-muted-foreground mb-2">
                  💰 Costs {referenceImage ? '6' : '1'} credit · {pageLimit - pagesUsed} remaining
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full py-3 rounded-xl font-semibold text-[#1A1A2E] flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 text-sm"
                  style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)', boxShadow: '0 4px 12px rgba(255,107,107,0.3)' }}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* RIGHT PANEL: Image Display */}
            <div className="flex-1 flex flex-col gap-3">

              {/* Main Image Area */}
              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-border min-h-[400px] lg:min-h-[520px] flex items-center justify-center">
                {generatedImageUrl ? (
                  <div className="w-full">
                    <img
                      src={generatedImageUrl}
                      alt="Generated coloring page"
                      className="w-full h-auto max-h-[560px] object-contain rounded-xl"
                    />
                  </div>
                ) : isGenerating ? (
                  <div className="text-center">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 mx-auto rounded-full border-4 border-[#FFB800]/20 border-t-[#FFB800] animate-spin" />
                      <Sparkles className="w-7 h-7 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#FFB800]" />
                    </div>
                    <p className="text-lg font-semibold text-foreground mb-2">Creating your coloring page...</p>
                    <p className="text-sm text-muted-foreground">
                      {referenceImage ? 'Transforming your reference image...' : 'This usually takes 10-30 seconds'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <div className="relative mb-4">
                      <Sparkles className="w-16 h-16 mx-auto text-[#FFB800]/20" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Wand2 className="w-6 h-6 text-[#FFB800]/40" />
                      </div>
                    </div>
                    <p className="text-lg font-semibold mb-1 text-foreground/60">Your coloring page will appear here</p>
                    <p className="text-sm">Type a description and hit Generate</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {generatedImageUrl && (
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="py-2.5 px-4 rounded-xl border-2 border-[#E5E0D5] text-foreground flex items-center justify-center gap-1.5 hover:border-[#FFB800] transition-all disabled:opacity-50 text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Regenerate
                  </button>

                  <Link
                    href={`/auto-color?src=${encodeURIComponent(generatedImageUrl)}`}
                    className="flex-1 py-2.5 rounded-xl text-[#1A1A2E] font-semibold flex items-center justify-center gap-1.5 transition-all hover:-translate-y-0.5 text-sm"
                    style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)', boxShadow: '0 4px 12px rgba(255,107,107,0.3)' }}
                  >
                    <Paintbrush className="w-4 h-4" />
                    Auto Color
                  </Link>

                  <div className="relative">
                    <button
                      onClick={() => { if (canExportPDF(plan)) { setDlOpen(!dlOpen); } else { handleDownload(); } }}
                      className="py-2.5 px-4 rounded-xl bg-[#1A1A2E] text-white font-semibold flex items-center justify-center gap-1.5 hover:bg-[#1A1A2E]/90 transition-all text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download
                      {canExportPDF(plan) && <ChevronDown className="w-3 h-3" />}
                    </button>
                    {dlOpen && canExportPDF(plan) && (
                      <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[120px] z-50">
                        <button onClick={() => { setDlOpen(false); handleDownload(); }} className="w-full px-4 py-2 text-sm text-left hover:bg-amber-50 flex items-center gap-2 text-[#1A1A2E]">
                          <Download className="w-3.5 h-3.5" /> PNG
                        </button>
                        <button onClick={() => { setDlOpen(false); handleDownloadPDF(); }} className="w-full px-4 py-2 text-sm text-left hover:bg-amber-50 flex items-center gap-2 text-[#FFB800]">
                          <FileText className="w-3.5 h-3.5" /> PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Generation History - ALWAYS VISIBLE, loaded from DB */}
              <div className="rounded-2xl p-3 shadow-sm border border-border bg-white">
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-bold text-foreground/70 uppercase tracking-wide">Recent</span>
                  {history.length > 0 && (
                    <span className="text-[9px] text-muted-foreground/60">{history.length} generation{history.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
                {history.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {history.slice(0, 12).map((item, i) => (
                      <button
                        key={item.ts}
                        onClick={() => { setGeneratedImageUrl(item.url); setSelectedStyle(item.style as any); }}
                        className={cn(
                          "group relative rounded-lg overflow-hidden border-2 transition-all aspect-[3/4]",
                          generatedImageUrl === item.url
                            ? "border-[#FFB800] shadow-sm"
                            : "border-[#E5E0D5] hover:border-[#FFB800]/50"
                        )}
                        title={item.prompt}
                      >
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[8px] text-white truncate">{item.prompt}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground/50 text-center py-2">
                    {isSignedIn ? "Generated pages will appear here" : "Sign in to see your history"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 text-sm font-medium">{error}</p>
                {(error.includes('credit') || error.includes('limit')) && (
                  <Link href="/pricing" className="text-red-600 underline text-xs hover:text-red-800">
                    View pricing plans →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Feedback */}
          <div className="text-center mt-6">
            <a
              href="mailto:support@pixcraftx.com?subject=PixCraftX%20Feedback"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-[#FFB800] transition-colors"
            >
              💬 Have feedback? We'd love to hear from you
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
