'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Palette, Undo2, Download, Printer, Eraser, Paintbrush, Save, Loader2, ZoomIn, ZoomOut, Maximize2, Pencil } from 'lucide-react';
import { floodFill } from '@/lib/floodFill';
import { useAuth, SignIn } from '@clerk/nextjs';

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

const SUPABASE_STORAGE_PREFIX = 'https://eurbsafbkffdnfmvcddy.supabase.co/storage/';

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

function toLocalUrl(url: string): string {
  if (url.includes('supabase.co/storage/')) {
    return url.replace(SUPABASE_STORAGE_PREFIX, '/supabase-storage/');
  }
  return url;
}

const ZOOM_LEVELS = [25, 50, 75, 100, 125, 150, 200];


function ColorContent() {
  const searchParams = useSearchParams();
  const { isSignedIn } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const colorCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalBaseRef = useRef<ImageData | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef(-1);
  const baseHistoryRef = useRef<ImageData[]>([]);
  const baseHistoryIndexRef = useRef(-1);
  const opLogRef = useRef<Array<'color' | 'base'>>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');
  const [tool, setTool] = useState<'fill' | 'pencil' | 'brush' | 'eraser'>('fill');
  const [brushSize, setBrushSize] = useState(8);

  // Adjust brush size when switching tools
  useEffect(() => {
    if (tool === 'pencil' && brushSize > 8) setBrushSize(3);
    else if (tool === 'pencil') setBrushSize(3);
    else if ((tool === 'brush' || tool === 'eraser') && brushSize < 2) setBrushSize(8);
  }, [tool]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 1000 });
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(100);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = searchParams.get('src');
    if (url) setImageUrl(url);
  }, [searchParams]);

  useEffect(() => {
    if (!imageUrl) return;
    const timer = setTimeout(() => {
      const baseCanvas = baseCanvasRef.current;
      const colorCanvas = colorCanvasRef.current;
      if (!baseCanvas || !colorCanvas) { setLoadError('Canvas not ready'); return; }
      const baseCtx = baseCanvas.getContext('2d');
      const colorCtx = colorCanvas.getContext('2d');
      if (!baseCtx || !colorCtx) { setLoadError('Cannot get context'); return; }
      const localUrl = toLocalUrl(imageUrl);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = localUrl;
      img.onload = () => {
        let w = img.width; let h = img.height;
        if (w > 800) { h = (800 / w) * h; w = 800; }
        if (h > 1000) { w = (1000 / h) * w; h = 1000; }
        w = Math.round(w); h = Math.round(h);
        baseCanvas.width = w; baseCanvas.height = h;
        colorCanvas.width = w; colorCanvas.height = h;
        baseCtx.drawImage(img, 0, 0, w, h);
        colorCtx.clearRect(0, 0, w, h);
        originalBaseRef.current = baseCtx.getImageData(0, 0, w, h);
        setCanvasSize({ w, h });
        const initialData = colorCtx.getImageData(0, 0, w, h);
        historyRef.current = [initialData];
        historyIndexRef.current = 0;
        baseHistoryRef.current = [baseCtx.getImageData(0, 0, w, h)];
        baseHistoryIndexRef.current = 0;
        opLogRef.current = [];
        setImageLoaded(true); setLoadError(null);
      };
      img.onerror = () => {
        fetch(localUrl)
          .then(res => { if (!res.ok) throw new Error('' + res.status); return res.blob(); })
          .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            const img2 = new Image();
            img2.onload = () => {
              const bc = baseCanvasRef.current; const cc = colorCanvasRef.current;
              if (!bc || !cc) return;
              const bCtx = bc.getContext('2d'); const cCtx = cc.getContext('2d');
              if (!bCtx || !cCtx) return;
              let w2 = img2.width; let h2 = img2.height;
              if (w2 > 800) { h2 = (800 / w2) * h2; w2 = 800; }
              if (h2 > 1000) { w2 = (1000 / h2) * w2; h2 = 1000; }
              w2 = Math.round(w2); h2 = Math.round(h2);
              bc.width = w2; bc.height = h2;
              cc.width = w2; cc.height = h2;
              bCtx.drawImage(img2, 0, 0, w2, h2);
              cCtx.clearRect(0, 0, w2, h2);
              originalBaseRef.current = bCtx.getImageData(0, 0, w2, h2);
              setCanvasSize({ w: w2, h: h2 });
              const init = cCtx.getImageData(0, 0, w2, h2);
              historyRef.current = [init]; historyIndexRef.current = 0;
              baseHistoryRef.current = [bCtx.getImageData(0, 0, w2, h2)]; baseHistoryIndexRef.current = 0;
              opLogRef.current = [];
              setImageLoaded(true); setLoadError(null);
                    URL.revokeObjectURL(blobUrl);
            };
            img2.onerror = () => { setLoadError('Image load failed'); setImageLoaded(true); URL.revokeObjectURL(blobUrl); };
            img2.src = blobUrl;
          })
          .catch(() => { setLoadError('Image load failed'); setImageLoaded(true); });
      };
    }, 200);
    return () => clearTimeout(timer);
  }, [imageUrl]);

  const saveToHistory = useCallback(() => {
    const colorCanvas = colorCanvasRef.current;
    if (!colorCanvas) return;
    const ctx = colorCanvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, colorCanvas.width, colorCanvas.height);
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(imageData);
    historyIndexRef.current = historyRef.current.length - 1;
    if (historyRef.current.length > 30) { historyRef.current.shift(); historyIndexRef.current--; }
    opLogRef.current.push('color');
  }, []);

  const saveToBaseHistory = useCallback(() => {
    const baseCanvas = baseCanvasRef.current;
    if (!baseCanvas) return;
    const ctx = baseCanvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
    baseHistoryRef.current = baseHistoryRef.current.slice(0, baseHistoryIndexRef.current + 1);
    baseHistoryRef.current.push(imageData);
    baseHistoryIndexRef.current = baseHistoryRef.current.length - 1;
    if (baseHistoryRef.current.length > 30) { baseHistoryRef.current.shift(); baseHistoryIndexRef.current--; }
    opLogRef.current.push('base');
  }, []);

  const undo = useCallback(() => {
    if (opLogRef.current.length === 0) return;
    const lastOp = opLogRef.current.pop();
    if (lastOp === 'base') {
      if (baseHistoryIndexRef.current <= 0) return;
      baseHistoryIndexRef.current--;
      const baseCanvas = baseCanvasRef.current;
      if (!baseCanvas) return;
      const ctx = baseCanvas.getContext('2d');
      if (!ctx) return;
      ctx.putImageData(baseHistoryRef.current[baseHistoryIndexRef.current], 0, 0);
    } else {
      if (historyIndexRef.current <= 0) return;
      historyIndexRef.current--;
      const colorCanvas = colorCanvasRef.current;
      if (!colorCanvas) return;
      const ctx = colorCanvas.getContext('2d');
      if (!ctx) return;
      ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
    }
  }, []);

  const getScale = useCallback(() => {
    const colorCanvas = colorCanvasRef.current;
    if (!colorCanvas) return 1;
    const rect = colorCanvas.getBoundingClientRect();
    return rect.width > 0 ? colorCanvas.width / rect.width : 1;
  }, []);

  const zoomIn = useCallback(() => {
    setZoom(prev => {
      const idx = ZOOM_LEVELS.findIndex(z => z >= prev);
      if (idx < ZOOM_LEVELS.length - 1) return ZOOM_LEVELS[idx + 1];
      return prev;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => {
      const idx = ZOOM_LEVELS.findIndex(z => z >= prev);
      if (idx > 0) return ZOOM_LEVELS[idx - 1];
      return prev;
    });
  }, []);

  const zoomFit = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const containerW = container.clientWidth - 32;
    const containerH = container.clientHeight - 32;
    const fitW = (containerW / canvasSize.w) * 100;
    const fitH = (containerH / canvasSize.h) * 100;
    const fitZoom = Math.min(fitW, fitH, 100);
    const bestZoom = ZOOM_LEVELS.reduce((prev, curr) => Math.abs(curr - fitZoom) < Math.abs(prev - fitZoom) ? curr : prev);
    setZoom(bestZoom);
  }, [canvasSize]);


  useEffect(() => {
    if (!imageLoaded) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const containerW = container.clientWidth - 32;
    const containerH = container.clientHeight - 32;
    const fitW = (containerW / canvasSize.w) * 100;
    const fitH = (containerH / canvasSize.h) * 100;
    const fitZoom = Math.min(fitW, fitH, 100);
    const bestZoom = ZOOM_LEVELS.reduce((prev, curr) => Math.abs(curr - fitZoom) < Math.abs(prev - fitZoom) ? curr : prev);
    setZoom(bestZoom);
  }, [imageLoaded, canvasSize]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (tool !== 'fill') return;
    const colorCanvas = colorCanvasRef.current; const baseCanvas = baseCanvasRef.current;
    if (!colorCanvas || !baseCanvas) return;
    const ctx = colorCanvas.getContext('2d');
    if (!ctx) return;
    const rect = colorCanvas.getBoundingClientRect();
    const scaleX = colorCanvas.width / rect.width;
    const scaleY = colorCanvas.height / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = colorCanvas.width; mergedCanvas.height = colorCanvas.height;
    const mergedCtx = mergedCanvas.getContext('2d');
    if (!mergedCtx) return;
    mergedCtx.drawImage(baseCanvas, 0, 0);
    mergedCtx.drawImage(colorCanvas, 0, 0);
    floodFill(ctx, x, y, hexToRgb(selectedColor), mergedCtx, 32);
    saveToHistory();
  }, [tool, selectedColor, saveToHistory]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (tool === 'fill') return;
    setIsDrawing(true);
    const targetCanvas = tool === 'pencil' ? baseCanvasRef.current : colorCanvasRef.current;
    if (!targetCanvas) return;
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;
    const rect = targetCanvas.getBoundingClientRect();
    const scaleX = targetCanvas.width / rect.width;
    const scaleY = targetCanvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (tool === 'pencil') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = brushSize;
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = brushSize * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = brushSize;
    }
  }, [tool, selectedColor, brushSize]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    if (!isDrawing) return;
    const targetCanvas = tool === 'pencil' ? baseCanvasRef.current : colorCanvasRef.current;
    if (!targetCanvas) return;
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;
    const rect = targetCanvas.getBoundingClientRect();
    const scaleX = targetCanvas.width / rect.width;
    const scaleY = targetCanvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    ctx.lineTo(x, y); ctx.stroke();
  }, [isDrawing, tool]);

  const handleCanvasMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (tool === 'pencil') {
      saveToBaseHistory();
    } else {
      const colorCanvas = colorCanvasRef.current;
      if (colorCanvas) { const ctx = colorCanvas.getContext('2d'); if (ctx) ctx.globalCompositeOperation = 'source-over'; }
      saveToHistory();
    }
  }, [isDrawing, tool, saveToHistory, saveToBaseHistory]);

  const handleMouseLeave = useCallback(() => {
    setCursorPos(null);
    if (isDrawing) {
      setIsDrawing(false);
      if (tool === 'pencil') {
        saveToBaseHistory();
      } else {
        const colorCanvas = colorCanvasRef.current;
        if (colorCanvas) { const ctx = colorCanvas.getContext('2d'); if (ctx) ctx.globalCompositeOperation = 'source-over'; }
        saveToHistory();
      }
    }
  }, [isDrawing, tool, saveToHistory, saveToBaseHistory]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) zoomIn();
      else zoomOut();
    }
  }, [zoomIn, zoomOut]);

  const getMergedCanvas = useCallback(() => {
    const baseCanvas = baseCanvasRef.current; const colorCanvas = colorCanvasRef.current;
    if (!baseCanvas || !colorCanvas) return null;
    const merged = document.createElement('canvas');
    merged.width = baseCanvas.width; merged.height = baseCanvas.height;
    const ctx = merged.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(baseCanvas, 0, 0); ctx.drawImage(colorCanvas, 0, 0);
    return merged;
  }, []);

  const handleDownload = useCallback(() => {
    if (!isSignedIn) { setShowSignIn(true); return; }
    const merged = getMergedCanvas(); if (!merged) return;
    const link = document.createElement('a');
    link.download = 'pixcraftx-colored-' + Date.now() + '.png';
    link.href = merged.toDataURL('image/png'); link.click();
  }, [isSignedIn, getMergedCanvas]);

  const handlePrint = useCallback(() => {
    if (!isSignedIn) { setShowSignIn(true); return; }
    const merged = getMergedCanvas(); if (!merged) return;
    const dataUrl = merged.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert('Please allow popups to print'); return; }
    printWindow.document.write('<!DOCTYPE html><html><head><title>PixCraftX - Print</title><style>@media print{@page{margin:0;size:A4;}body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;}img{max-width:100%;max-height:100vh;object-fit:contain;}}body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:white;}img{max-width:90vw;max-height:90vh;}</style></head><body><img src="' + dataUrl + '" onload="setTimeout(function(){window.print();},300);" /></body></html>');
    printWindow.document.close();
  }, [isSignedIn, getMergedCanvas]);

  const handleSaveToHistory = useCallback(async () => {
    if (!isSignedIn) { setShowSignIn(true); return; }
    const merged = getMergedCanvas(); if (!merged) return;
    setSaveStatus('saving');
    try {
      merged.toBlob(async (blob) => {
        if (!blob) { setSaveStatus('error'); return; }
        const formData = new FormData();
        formData.append('image', blob, 'colored.png');
        const res = await fetch('/api/history', { method: 'POST', body: formData });
        if (!res.ok) { setSaveStatus('error'); return; }
        setSaveStatus('saved'); setTimeout(() => setSaveStatus(null), 2000);
      }, 'image/png');
    } catch { setSaveStatus('error'); setTimeout(() => setSaveStatus(null), 2000); }
  }, [isSignedIn, getMergedCanvas]);

  const cursorRadius = tool === 'eraser' ? (brushSize * 3) / getScale() / 2 : tool === 'pencil' ? Math.max(brushSize / getScale() / 2, 2) : brushSize / getScale() / 2;

  if (!imageUrl) {
    return <><Navbar /><main className="min-h-screen pt-20 pb-16 bg-background flex items-center justify-center"><p className="text-muted-foreground text-lg">No image selected. Generate a coloring page first.</p></main><Footer /></>;
  }

  const displayW = canvasSize.w * (zoom / 100);
  const displayH = canvasSize.h * (zoom / 100);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="text-center mb-6">
            <h1 className="font-display text-3xl md:text-4xl mb-2 text-foreground">Color Your Page</h1>
            <p className="text-muted-foreground">Pick a color and click to fill · Use Pencil to close gaps before coloring</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <div className="space-y-4">
              <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                <h3 className="text-sm font-semibold mb-3 text-foreground">Tools</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setTool('fill')} className={"flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all " + (tool === 'fill' ? 'border-[#FFB800] bg-[#FFB800]/10' : 'border-[#E5E0D5] hover:border-[#FFB800]/50')}><Paintbrush className="w-5 h-5" /><span className="text-xs font-medium">Fill</span></button>
                  <button onClick={() => setTool('pencil')} className={"flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all " + (tool === 'pencil' ? 'border-[#FFB800] bg-[#FFB800]/10' : 'border-[#E5E0D5] hover:border-[#FFB800]/50')}><Pencil className="w-5 h-5" /><span className="text-xs font-medium">Pencil</span></button>
                  <button onClick={() => setTool('brush')} className={"flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all " + (tool === 'brush' ? 'border-[#FFB800] bg-[#FFB800]/10' : 'border-[#E5E0D5] hover:border-[#FFB800]/50')}><Palette className="w-5 h-5" /><span className="text-xs font-medium">Brush</span></button>
                  <button onClick={() => setTool('eraser')} className={"flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all " + (tool === 'eraser' ? 'border-[#FFB800] bg-[#FFB800]/10' : 'border-[#E5E0D5] hover:border-[#FFB800]/50')}><Eraser className="w-5 h-5" /><span className="text-xs font-medium">Eraser</span></button>
                </div>
              </div>
              
              {tool !== 'fill' && (
                <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                  <h3 className="text-sm font-semibold mb-3 text-foreground">{tool === 'pencil' ? 'Pencil Size' : 'Size'}</h3>
                  <input type="range" min={tool === 'pencil' ? 1 : 2} max={tool === 'pencil' ? 8 : 30} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full accent-[#FFB800]" />
                  <div className="text-center text-sm text-muted-foreground mt-1">{brushSize}px</div>
                  {tool === 'pencil' && (
                    <p className="text-[11px] text-muted-foreground mt-2 leading-tight">Draw black lines to close gaps, then use Fill to color.</p>
                  )}
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
                <button onClick={handleDownload} className="w-full py-2.5 rounded-xl bg-[#1A1A2E] text-white flex items-center justify-center gap-2 hover:bg-[#1A1A2E]/90 transition-all text-sm font-medium"><Download className="w-4 h-4" /> {!isSignedIn ? 'Sign in to Download' : 'Download PNG'}</button>
                <button onClick={handlePrint} className="w-full py-2.5 rounded-xl border-2 border-[#E5E0D5] text-foreground flex items-center justify-center gap-2 hover:border-[#FFB800] transition-all text-sm font-medium"><Printer className="w-4 h-4" /> {!isSignedIn ? 'Sign in to Print' : 'Print A4'}</button>
                <button onClick={handleSaveToHistory} disabled={saveStatus === 'saving'} className="w-full py-2.5 rounded-xl text-[#1A1A2E] flex items-center justify-center gap-2 transition-all text-sm font-medium disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)' }}>
                  {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Failed' : !isSignedIn ? 'Sign in to Save' : 'Save to My Pages'}
                </button>
              </div>
            </div>
            
            <div className="bg-card rounded-3xl shadow-lg border border-border flex flex-col">
              <div className="flex items-center justify-center gap-3 px-4 py-2.5 border-b border-border bg-card rounded-t-3xl">
                <button onClick={zoomOut} disabled={zoom <= ZOOM_LEVELS[0]} className="p-1.5 rounded-lg hover:bg-[#E5E0D5] transition-all disabled:opacity-30 disabled:cursor-not-allowed"><ZoomOut className="w-4 h-4" /></button>
                <span className="text-sm font-medium text-foreground min-w-[48px] text-center">{zoom}%</span>
                <button onClick={zoomIn} disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]} className="p-1.5 rounded-lg hover:bg-[#E5E0D5] transition-all disabled:opacity-30 disabled:cursor-not-allowed"><ZoomIn className="w-4 h-4" /></button>
                <div className="w-px h-5 bg-border mx-1" />
                <button onClick={zoomFit} className="p-1.5 rounded-lg hover:bg-[#E5E0D5] transition-all" title="Fit to view"><Maximize2 className="w-4 h-4" /></button>
              </div>

              <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-auto p-4" 
                style={{ minHeight: '500px', maxHeight: '75vh' }}
                onWheel={handleWheel}
              >
                <div 
                  ref={containerRef} 
                  className="relative mx-auto" 
                  style={{ width: displayW, height: displayH }}
                  onClick={handleCanvasClick} 
                  onMouseDown={handleCanvasMouseDown} 
                  onMouseMove={handleCanvasMouseMove} 
                  onMouseUp={handleCanvasMouseUp} 
                  onMouseLeave={handleMouseLeave}
                >
                  {!imageLoaded && !loadError && (
                    <div className="absolute inset-0 flex items-center justify-center z-10"><div className="text-center"><Loader2 className="w-12 h-12 mx-auto mb-3 text-[#FFB800] animate-spin" /><p className="text-muted-foreground">Loading coloring page...</p></div></div>
                  )}
                  {loadError && (
                    <div className="absolute inset-0 flex items-center justify-center z-10"><div className="text-center"><p className="text-red-500 mb-2">{loadError}</p><button onClick={() => { setImageLoaded(false); setLoadError(null); window.location.reload(); }} className="px-4 py-2 bg-[#FFB800] rounded-xl text-sm font-medium">Retry</button></div></div>
                  )}
                  
                  <div className={"relative w-full h-full " + (imageLoaded && !loadError ? '' : 'opacity-0')}>
                    <canvas ref={baseCanvasRef} className="w-full h-full rounded-xl shadow-md block" style={{ imageRendering: zoom > 100 ? 'pixelated' : 'auto' }} />
                    <canvas ref={colorCanvasRef} className="absolute top-0 left-0 w-full h-full rounded-xl" style={{ imageRendering: zoom > 100 ? 'pixelated' : 'auto', cursor: tool === 'fill' ? 'crosshair' : 'none' }} />
                  </div>
                  {cursorPos && tool !== 'fill' && imageLoaded && !loadError && (
                    <div className="absolute pointer-events-none z-20 rounded-full border-2" style={{ left: cursorPos.x - cursorRadius, top: cursorPos.y - cursorRadius, width: cursorRadius * 2, height: cursorRadius * 2, borderColor: tool === 'eraser' ? '#666666' : tool === 'pencil' ? '#000000' : selectedColor, backgroundColor: tool === 'eraser' ? 'rgba(255,255,255,0.3)' : tool === 'pencil' ? 'rgba(0,0,0,0.3)' : 'transparent' }} />
                  )}
                </div>
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
            <h3 className="font-display text-xl mb-4 text-center text-foreground">Sign in to Continue</h3>
            <SignIn routing="hash" />
          </div>
        </div>
      )}
    </>
  );
}

export default function ColorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-[#FFB800]" /></div>}>
      <ColorContent />
    </Suspense>
  );
}
