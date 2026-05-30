'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Palette, Undo2, Download, Printer, Eraser, Paintbrush, Save, Loader2 } from 'lucide-react';
import { floodFill } from '@/lib/floodFill';
import { useAuth } from '@clerk/nextjs';

const COLOR_PALETTE = [
  '#FF6B6B', '#E74C3C', '#C0392B', '#FF4757',
  '#FF9F43', '#E67E22', '#F39C12', '#FFA502',
  '#FFD93D', '#F1C40F', '#FFB800', '#ECCC68',
  '#2ECC71', '#27AE60', '#1ABC9C', '#00B894',
  '#3498DB', '#2980B9', '#0984E3', '#6C5CE7',
  '#9B59B6', '#8E44AD', '#A29BFE', '#6C5CE7',
  '#FD79A8', '#E84393', '#FF6B81', '#F8A5C2',
  '#D35400', '#A0522D', '#8B4513', '#CD853F',
  '#FFFFFF', '#D5D5D5', '#95A5A6', '#7F8C8D',
  '#34495E', '#2C3E50', '#1A1A2E', '#000000',
];

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

function ColorContent() {
  const searchParams = useSearchParams();
  const { isSignedIn } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef(-1);
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');
  const [tool, setTool] = useState<'fill' | 'brush' | 'eraser'>('fill');
  const [brushSize, setBrushSize] = useState(8);
  const [isDrawing, setIsDrawing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    const url = searchParams.get('src');
    if (url) setImageUrl(url);
  }, [searchParams]);

  // Load image onto canvas - always render canvas, load image after
  useEffect(() => {
    if (!imageUrl) return;
    
    // Small delay to ensure canvas is rendered in DOM
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Use proxy to avoid CORS
      img.src = '/api/proxy-image?url=' + encodeURIComponent(imageUrl);
      
      img.onload = () => {
        const maxW = 800;
        const maxH = 1000;
        let w = img.width;
        let h = img.height;
        
        if (w > maxW) { h = (maxW / w) * h; w = maxW; }
        if (h > maxH) { w = (maxH / h) * w; h = maxH; }
        
        canvas.width = Math.round(w);
        canvas.height = Math.round(h);
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        historyRef.current = [imageData];
        historyIndexRef.current = 0;
        
        setImageLoaded(true);
      };
      
      img.onerror = () => {
        // Try direct load as fallback
        const img2 = new Image();
        img2.crossOrigin = 'anonymous';
        img2.src = imageUrl;
        img2.onload = () => {
          const canvas2 = canvasRef.current;
          if (!canvas2) return;
          const ctx2 = canvas2.getContext('2d');
          if (!ctx2) return;
          
          const maxW = 800;
          const maxH = 1000;
          let w = img2.width;
          let h = img2.height;
          if (w > maxW) { h = (maxW / w) * h; w = maxW; }
          if (h > maxH) { w = (maxH / h) * w; h = maxH; }
          
          canvas2.width = Math.round(w);
          canvas2.height = Math.round(h);
          ctx2.drawImage(img2, 0, 0, canvas2.width, canvas2.height);
          
          const imageData = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);
          historyRef.current = [imageData];
          historyIndexRef.current = 0;
          setImageLoaded(true);
        };
        img2.onerror = () => {
          setImageLoaded(true); // Show canvas anyway
        };
      };
    }, 100);
    
    return () => clearTimeout(timer);
  }, [imageUrl]);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(imageData);
    historyIndexRef.current = historyRef.current.length - 1;
    
    if (historyRef.current.length > 30) {
      historyRef.current.shift();
      historyIndexRef.current--;
    }
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'fill') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    floodFill(ctx, x, y, hexToRgb(selectedColor));
    saveToHistory();
  }, [tool, selectedColor, saveToHistory]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'fill') return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = brushSize * 3;
    } else {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = brushSize;
    }
  }, [tool, selectedColor, brushSize]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing]);

  const handleCanvasMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveToHistory();
  }, [isDrawing, saveToHistory]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'colorforge-colored-' + Date.now() + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  const handlePrint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write('<html><head><title>ColorForge - Print</title><style>@media print{ @page{margin:0;size:A4;} body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;} img{max-width:100%;max-height:100vh;object-fit:contain;} }</style></head><body><img src="' + dataUrl + '" onload="window.print();window.close();" /></body></html>');
    win.document.close();
  }, []);

  const handleSaveToHistory = useCallback(async () => {
    if (!isSignedIn) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaveStatus('saving');
    
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) { setSaveStatus('error'); return; }
        const formData = new FormData();
        formData.append('image', blob, 'colored.png');
        const res = await fetch('/api/history', { method: 'POST', body: formData });
        if (!res.ok) { setSaveStatus('error'); return; }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 2000);
      }, 'image/png');
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 2000);
    }
  }, [isSignedIn]);

  if (!imageUrl) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-20 pb-16 bg-background flex items-center justify-center">
          <p className="text-muted-foreground text-lg">No image selected. Generate a coloring page first.</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="text-center mb-6">
            <h1 className="font-display text-3xl md:text-4xl mb-2 text-foreground">Color Your Page</h1>
            <p className="text-muted-foreground">Pick a color and click to fill, or use the brush to draw</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            {/* Left - Tools */}
            <div className="space-y-4">
              <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                <h3 className="text-sm font-semibold mb-3 text-foreground">Tools</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setTool('fill')} className={"flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all " + (tool === 'fill' ? 'border-[#FFB800] bg-[#FFB800]/10' : 'border-[#E5E0D5] hover:border-[#FFB800]/50')}>
                    <Paintbrush className="w-5 h-5" /><span className="text-xs font-medium">Fill</span>
                  </button>
                  <button onClick={() => setTool('brush')} className={"flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all " + (tool === 'brush' ? 'border-[#FFB800] bg-[#FFB800]/10' : 'border-[#E5E0D5] hover:border-[#FFB800]/50')}>
                    <Palette className="w-5 h-5" /><span className="text-xs font-medium">Brush</span>
                  </button>
                  <button onClick={() => setTool('eraser')} className={"flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all " + (tool === 'eraser' ? 'border-[#FFB800] bg-[#FFB800]/10' : 'border-[#E5E0D5] hover:border-[#FFB800]/50')}>
                    <Eraser className="w-5 h-5" /><span className="text-xs font-medium">Eraser</span>
                  </button>
                </div>
              </div>

              {tool !== 'fill' && (
                <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                  <h3 className="text-sm font-semibold mb-3 text-foreground">Size</h3>
                  <input type="range" min="2" max="30" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full accent-[#FFB800]" />
                  <div className="text-center text-sm text-muted-foreground mt-1">{brushSize}px</div>
                </div>
              )}

              <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                <h3 className="text-sm font-semibold mb-3 text-foreground">Colors</h3>
                <div className="grid grid-cols-8 gap-2">
                  {COLOR_PALETTE.map((color) => (
                    <button key={color} onClick={() => setSelectedColor(color)} className={"w-8 h-8 rounded-full border-2 transition-all hover:scale-110 " + (selectedColor === color ? 'border-[#1A1A2E] scale-110 ring-2 ring-[#FFB800]' : 'border-gray-200')} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-2xl p-5 shadow-sm border border-border space-y-2">
                <button onClick={undo} className="w-full py-2.5 rounded-xl border-2 border-[#E5E0D5] text-foreground flex items-center justify-center gap-2 hover:border-[#FFB800] transition-all text-sm font-medium"><Undo2 className="w-4 h-4" /> Undo</button>
                <button onClick={handleDownload} className="w-full py-2.5 rounded-xl bg-[#1A1A2E] text-white flex items-center justify-center gap-2 hover:bg-[#1A1A2E]/90 transition-all text-sm font-medium"><Download className="w-4 h-4" /> Download PNG</button>
                <button onClick={handlePrint} className="w-full py-2.5 rounded-xl border-2 border-[#E5E0D5] text-foreground flex items-center justify-center gap-2 hover:border-[#FFB800] transition-all text-sm font-medium"><Printer className="w-4 h-4" /> Print A4</button>
                {isSignedIn && (
                  <button onClick={handleSaveToHistory} disabled={saveStatus === 'saving'} className="w-full py-2.5 rounded-xl text-[#1A1A2E] flex items-center justify-center gap-2 transition-all text-sm font-medium disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)' }}>
                    {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Failed' : 'Save to My Pages'}
                  </button>
                )}
              </div>
            </div>

            {/* Right - Canvas - ALWAYS rendered */}
            <div className="bg-card rounded-3xl p-4 md:p-6 shadow-lg border border-border">
              <div className="flex items-center justify-center min-h-[500px] relative">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 mx-auto mb-3 text-[#FFB800] animate-spin" />
                      <p className="text-muted-foreground">Loading coloring page...</p>
                    </div>
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  className={"max-w-full max-h-[70vh] rounded-xl shadow-md cursor-crosshair " + (imageLoaded ? '' : 'opacity-0')}
                  style={{ imageRendering: 'auto' }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ColorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFB800]" />
      </div>
    }>
      <ColorContent />
    </Suspense>
  );
}
