'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Palette, Undo2, Download, Printer, Eraser, Paintbrush, Save, Loader2, ZoomIn, ZoomOut, Maximize2, Pencil, Pipette, FileText, ChevronDown } from 'lucide-react';
import { floodFill } from '@/lib/floodFill';
import { useAuth, useClerk } from '@clerk/nextjs';
import { downloadPNG, downloadPDF, canExportPDF } from '@/lib/download-utils';

// --- Color Utilities ---
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

const SUPABASE_STORAGE_PREFIX = 'https://eurbsafbkffdnfmvcddy.supabase.co/storage/';

function toLocalUrl(url: string): string {
  if (url.includes('supabase.co/storage/')) {
    return url.replace(SUPABASE_STORAGE_PREFIX, '/supabase-storage/');
  }
  return url;
}

const ZOOM_LEVELS = [25, 50, 75, 100, 125, 150, 200];

const QUICK_PRESETS = [
  '#FF0000', '#FF6B00', '#FFB800', '#FFD700',
  '#00CC00', '#2ECC71', '#00B894', '#00CED1',
  '#0066FF', '#3498DB', '#6C5CE7', '#9B59B6',
  '#FF69B4', '#E84393', '#8B4513', '#000000',
  '#FFFFFF', '#808080',
];

// Gradient bar: generates a smooth transition through hues
const HUE_GRADIENT = Array.from({ length: 13 }, (_, i) => hslToHex(i * 30, 100, 50)).join(', ');

function ColorContent() {
  const searchParams = useSearchParams();
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
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
  const [tool, setTool] = useState<'fill' | 'pencil' | 'brush' | 'eraser' | 'eyedropper'>('fill');
  const [brushSize, setBrushSize] = useState(8);
  const [dlOpen, setDlOpen] = useState(false)
  const [plan, setPlan] = useState('free');
  const [isDrawing, setIsDrawing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 1000 });
  const [zoom, setZoom] = useState(100);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const gradientBarRef = useRef<HTMLDivElement>(null);

  // HSL state derived from selectedColor
  const [hsl, setHsl] = useState<[number, number, number]>(() => hexToHsl('#FF6B6B'));

  // Update HSL when color changes externally
  useEffect(() => {
    setHsl(hexToHsl(selectedColor));
  }, [selectedColor]);

  // Adjust brush size when switching tools
  useEffect(() => {
    if (tool === 'pencil') setBrushSize(3);
    else if ((tool === 'brush' || tool === 'eraser') && brushSize < 2) setBrushSize(8);
  }, [tool]);

  useEffect(() => {
    const url = searchParams.get('src');
    if (url) setImageUrl(url);
  }, [searchParams]);

  useEffect(() => {
    if (!imageUrl) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
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
        if (cancelled) return;
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
              if (cancelled) { URL.revokeObjectURL(blobUrl); return; }
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
    return () => { cancelled = true; clearTimeout(timer); };
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

  // Fetch user plan for PDF/watermark features
  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/usage')
        .then(res => res.json())
        .then(data => { if (data.plan) setPlan(data.plan); })
        .catch(() => {});
    }
  }, [isSignedIn]);

  // Handle HSL slider change
  const handleHslChange = useCallback((newHsl: [number, number, number]) => {
    setHsl(newHsl);
    setSelectedColor(hslToHex(newHsl[0], newHsl[1], newHsl[2]));
  }, []);

  // Handle gradient bar click - pick color from gradient
  const handleGradientClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = gradientBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const hue = Math.round(x * 360);
    handleHslChange([hue, hsl[1], hsl[2]]);
  }, [hsl, handleHslChange]);

  // Eyedropper: pick color from canvas
  const handleEyedropperClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const colorCanvas = colorCanvasRef.current;
    const baseCanvas = baseCanvasRef.current;
    if (!colorCanvas || !baseCanvas) return;
    const rect = colorCanvas.getBoundingClientRect();
    const scaleX = colorCanvas.width / rect.width;
    const scaleY = colorCanvas.height / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    // Merge canvases to get the actual visible color
    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = baseCanvas.width;
    mergedCanvas.height = baseCanvas.height;
    const mergedCtx = mergedCanvas.getContext('2d');
    if (!mergedCtx) return;
    mergedCtx.drawImage(baseCanvas, 0, 0);
    mergedCtx.drawImage(colorCanvas, 0, 0);
    const pixel = mergedCtx.getImageData(x, y, 1, 1).data;
    const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('');
    setSelectedColor(hex);
    setHsl(rgbToHsl(pixel[0], pixel[1], pixel[2]));
    setTool('fill'); // Switch back to fill after picking
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (tool === 'eyedropper') {
      handleEyedropperClick(e);
      return;
    }
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
  }, [tool, selectedColor, saveToHistory, handleEyedropperClick]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (tool === 'fill' || tool === 'eyedropper') return;
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
    // Track cursor position for brush size circle
    // With CSS transform, need to convert from visual (transformed) coords to pre-transform coords
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const visualScale = container.offsetWidth > 0 ? rect.width / container.offsetWidth : 1;
      setCursorPos({ x: (e.clientX - rect.left) / visualScale, y: (e.clientY - rect.top) / visualScale });
    }
    if (!isDrawing) return;
    const targetCanvas = tool === 'pencil' ? baseCanvasRef.current : colorCanvasRef.current;
    if (!targetCanvas) return;
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;
    const canvasRect = targetCanvas.getBoundingClientRect();
    const scaleX = targetCanvas.width / canvasRect.width;
    const scaleY = targetCanvas.height / canvasRect.height;
    const x = (e.clientX - canvasRect.left) * scaleX;
    const y = (e.clientY - canvasRect.top) * scaleY;
    ctx.lineTo(x, y); ctx.stroke();
  }, [isDrawing, tool]);

  const handleCanvasMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (tool === 'pencil') {
      saveToBaseHistory();
    } else if (tool === 'brush') {
      // Clean up: remove color pixels that overlap with black lines on baseCanvas
      const colorCanvas = colorCanvasRef.current;
      const baseCanvas = baseCanvasRef.current;
      if (colorCanvas && baseCanvas) {
        const colorCtx = colorCanvas.getContext('2d');
        const baseCtx = baseCanvas.getContext('2d');
        if (colorCtx && baseCtx) {
          colorCtx.globalCompositeOperation = 'source-over';
          const w = colorCanvas.width;
          const h = colorCanvas.height;
          const baseData = baseCtx.getImageData(0, 0, w, h);
          const colorData = colorCtx.getImageData(0, 0, w, h);
          for (let i = 0; i < baseData.data.length; i += 4) {
            // Only clear color pixel if base pixel is a dark line (not white background)
            const r = baseData.data[i], g = baseData.data[i + 1], b = baseData.data[i + 2], a = baseData.data[i + 3];
            const luminance = (r + g + b) / 3;
            if (a > 128 && luminance < 200) {
              colorData.data[i] = 0;
              colorData.data[i + 1] = 0;
              colorData.data[i + 2] = 0;
              colorData.data[i + 3] = 0;
            }
          }
          colorCtx.putImageData(colorData, 0, 0);
        }
      }
      saveToHistory();
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
      } else if (tool === 'brush') {
        const colorCanvas = colorCanvasRef.current;
        const baseCanvas = baseCanvasRef.current;
        if (colorCanvas && baseCanvas) {
          const colorCtx = colorCanvas.getContext('2d');
          const baseCtx = baseCanvas.getContext('2d');
          if (colorCtx && baseCtx) {
            colorCtx.globalCompositeOperation = 'source-over';
            const w = colorCanvas.width;
            const h = colorCanvas.height;
            const baseData = baseCtx.getImageData(0, 0, w, h);
            const colorData = colorCtx.getImageData(0, 0, w, h);
            for (let i = 0; i < baseData.data.length; i += 4) {
              const r = baseData.data[i], g = baseData.data[i + 1], b = baseData.data[i + 2], a = baseData.data[i + 3];
              const luminance = (r + g + b) / 3;
              if (a > 128 && luminance < 200) {
                colorData.data[i] = 0;
                colorData.data[i + 1] = 0;
                colorData.data[i + 2] = 0;
                colorData.data[i + 3] = 0;
              }
            }
            colorCtx.putImageData(colorData, 0, 0);
          }
        }
        saveToHistory();
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

  const handleDownload = useCallback(async () => {
    if (!isSignedIn) { openSignIn(); return; }
    const merged = getMergedCanvas(); if (!merged) return;
    const dataUrl = merged.toDataURL('image/png');
    const filename = `pixcraftx-colored-${Date.now()}`;
    if (plan !== 'free') {
      const link = document.createElement('a');
      link.download = filename + '.png';
      link.href = dataUrl; link.click();
    } else {
      // Free user: add watermark
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
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
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.download = filename + '.png'; a.href = url; a.click();
          URL.revokeObjectURL(url);
        }, 'image/png');
      };
      img.src = dataUrl;
    }
  }, [isSignedIn, getMergedCanvas, plan]);

  const handleDownloadPDF = useCallback(async () => {
    if (!isSignedIn) { openSignIn(); return; }
    const merged = getMergedCanvas(); if (!merged) return;
    const dataUrl = merged.toDataURL('image/png');
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
    const pageW = 8.5, pageH = 11, margin = 0.5;
    const maxW = pageW - margin*2, maxH = pageH - margin*2;
    const img = new Image();
    await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = dataUrl; });
    const aspect = img.width / img.height;
    let dw = maxW, dh = dw / aspect;
    if (dh > maxH) { dh = maxH; dw = dh * aspect; }
    const x = (pageW - dw) / 2, y = (pageH - dh) / 2;
    pdf.addImage(dataUrl, 'PNG', x, y, dw, dh);
    pdf.save(`pixcraftx-colored-${Date.now()}.pdf`);
  }, [isSignedIn, getMergedCanvas]);

  const handlePrint = useCallback(() => {
    if (!isSignedIn) { openSignIn(); return; }
    const merged = getMergedCanvas(); if (!merged) return;
    const dataUrl = merged.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert('Please allow popups to print'); return; }
    printWindow.document.write('<!DOCTYPE html><html><head><title>PixCraftX - Print</title><style>@media print{@page{margin:0;size:A4;}body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;}img{max-width:100%;max-height:100vh;object-fit:contain;}}body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:white;}img{max-width:90vw;max-height:90vh;}</style></head><body><img src="' + dataUrl + '" onload="setTimeout(function(){window.print();},300);" /></body></html>');
    printWindow.document.close();
  }, [isSignedIn, getMergedCanvas]);

  const handleSaveToHistory = useCallback(async () => {
    if (!isSignedIn) { openSignIn(); return; }
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

  if (!imageUrl) {
    return <><Navbar /><main className="min-h-screen pt-20 pb-16 bg-background flex items-center justify-center"><p className="text-muted-foreground text-lg">No image selected. Generate a coloring page first.</p></main><Footer /></>;
  }

  // Cursor style for canvas
  const canvasCursor = tool === 'fill' ? 'crosshair' : tool === 'eyedropper' ? 'crosshair' : 'none';
  // With CSS transform zoom, cursor is inside the transformed container so it scales automatically.
  // cursorRadius should be in the container's pre-transform coordinate space.
  const cursorRadius = tool === 'eraser' ? (brushSize * 3) / 2 : brushSize / 2;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="text-center mb-6">
            <h1 className="font-display text-3xl md:text-4xl mb-2 text-foreground">Color Your Page</h1>
            <p className="text-muted-foreground">Pick a color and click to fill · Use Pencil to close gaps before coloring</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
            <div className="space-y-4">
              {/* Tools */}
              <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                <h3 className="text-sm font-semibold mb-3 text-foreground">Tools</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setTool('fill')} className={"flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all " + (tool === 'fill' ? 'border-[#FFB800] bg-[#FFB800]/10' : 'border-[#E5E0D5] hover:border-[#FFB800]/50')}><Paintbrush className="w-5 h-5" /><span className="text-xs font-medium">Fill</span></button>
                  <button onClick={() => setTool('pencil')} className={"flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all " + (tool === 'pencil' ? 'border-[#FFB800] bg-[#FFB800]/10' : 'border-[#E5E0D5] hover:border-[#FFB800]/50')}><Pencil className="w-5 h-5" /><span className="text-xs font-medium">Pencil</span></button>
                  <button onClick={() => setTool('brush')} className={"flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all " + (tool === 'brush' ? 'border-[#FFB800] bg-[#FFB800]/10' : 'border-[#E5E0D5] hover:border-[#FFB800]/50')}><Palette className="w-5 h-5" /><span className="text-xs font-medium">Brush</span></button>
                  <button onClick={() => setTool('eraser')} className={"flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all " + (tool === 'eraser' ? 'border-[#FFB800] bg-[#FFB800]/10' : 'border-[#E5E0D5] hover:border-[#FFB800]/50')}><Eraser className="w-5 h-5" /><span className="text-xs font-medium">Eraser</span></button>
                  <button onClick={() => setTool('eyedropper')} className={"flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all col-span-2 " + (tool === 'eyedropper' ? 'border-[#FFB800] bg-[#FFB800]/10' : 'border-[#E5E0D5] hover:border-[#FFB800]/50')}><Pipette className="w-5 h-5" /><span className="text-xs font-medium">Eyedropper (Pick color from canvas)</span></button>
                </div>
              </div>
              
              {/* Size slider */}
              {tool !== 'fill' && tool !== 'eyedropper' && (
                <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                  <h3 className="text-sm font-semibold mb-3 text-foreground">{tool === 'pencil' ? 'Pencil Size' : 'Size'}</h3>
                  <input type="range" min={tool === 'pencil' ? 1 : 2} max={tool === 'pencil' ? 8 : 30} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full accent-[#FFB800]" />
                  <div className="text-center text-sm text-muted-foreground mt-1">{brushSize}px</div>
                  {tool === 'pencil' && (
                    <p className="text-[11px] text-muted-foreground mt-2 leading-tight">Draw black lines to close gaps, then use Fill to color.</p>
                  )}
                </div>
              )}

              {/* Color Picker */}
              <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                <h3 className="text-sm font-semibold mb-3 text-foreground">Colors</h3>
                
                {/* Current color preview */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl border-2 border-gray-200 shadow-inner" style={{ backgroundColor: selectedColor }} />
                  <div>
                    <p className="text-sm font-mono font-bold text-foreground">{selectedColor.toUpperCase()}</p>
                    <p className="text-[11px] text-muted-foreground">H:{hsl[0]}° S:{hsl[1]}% L:{hsl[2]}%</p>
                  </div>
                </div>

                {/* Hue slider */}
                <div className="mb-3">
                  <label className="text-[11px] text-muted-foreground mb-1 block">Hue</label>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={hsl[0]}
                    onChange={(e) => handleHslChange([Number(e.target.value), hsl[1], hsl[2]])}
                    className="w-full h-3 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${HUE_GRADIENT})`,
                    }}
                  />
                </div>

                {/* Saturation slider */}
                <div className="mb-3">
                  <label className="text-[11px] text-muted-foreground mb-1 block">Saturation</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={hsl[1]}
                    onChange={(e) => handleHslChange([hsl[0], Number(e.target.value), hsl[2]])}
                    className="w-full h-3 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${hslToHex(hsl[0], 0, hsl[2])}, ${hslToHex(hsl[0], 100, hsl[2])})`,
                    }}
                  />
                </div>

                {/* Lightness slider */}
                <div className="mb-4">
                  <label className="text-[11px] text-muted-foreground mb-1 block">Lightness</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={hsl[2]}
                    onChange={(e) => handleHslChange([hsl[0], hsl[1], Number(e.target.value)])}
                    className="w-full h-3 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #000000, ${hslToHex(hsl[0], hsl[1], 50)}, #ffffff)`,
                    }}
                  />
                </div>

                {/* Gradient bar - click to pick hue smoothly */}
                <div className="mb-4">
                  <label className="text-[11px] text-muted-foreground mb-1 block">Gradient</label>
                  <div
                    ref={gradientBarRef}
                    onClick={handleGradientClick}
                    className="w-full h-6 rounded-full cursor-pointer relative overflow-hidden border border-gray-200"
                    style={{
                      background: `linear-gradient(to right, ${HUE_GRADIENT})`,
                    }}
                  >
                    {/* Indicator */}
                    <div
                      className="absolute top-0 w-1 h-full bg-white shadow-md rounded-full"
                      style={{ left: `${(hsl[0] / 360) * 100}%`, transform: 'translateX(-50%)' }}
                    />
                  </div>
                </div>

                {/* Quick presets */}
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1.5 block">Quick Presets</label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PRESETS.map((color) => (
                      <button
                        key={color}
                        onClick={() => { setSelectedColor(color); setHsl(hexToHsl(color)); }}
                        className={"w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 " + (selectedColor === color ? 'border-[#1A1A2E] scale-110 ring-1 ring-[#FFB800]' : 'border-gray-200')}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Canvas area */}
            <div className="bg-card rounded-3xl shadow-lg border border-border flex flex-col min-w-0 overflow-hidden">
              <div className="flex items-center justify-center gap-3 px-4 py-2.5 border-b border-border bg-card rounded-t-3xl">
                <button onClick={zoomOut} disabled={zoom <= ZOOM_LEVELS[0]} className="p-1.5 rounded-lg hover:bg-[#E5E0D5] transition-all disabled:opacity-30 disabled:cursor-not-allowed"><ZoomOut className="w-4 h-4" /></button>
                <span className="text-sm font-medium text-foreground min-w-[48px] text-center">{zoom}%</span>
                <button onClick={zoomIn} disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]} className="p-1.5 rounded-lg hover:bg-[#E5E0D5] transition-all disabled:opacity-30 disabled:cursor-not-allowed"><ZoomIn className="w-4 h-4" /></button>
              </div>

              <div 
                ref={scrollContainerRef}
                className="overflow-auto p-4" 
                style={{ maxHeight: '75vh' }}
                onWheel={handleWheel}
              >
                {/* Spacer creates scrollable area at visual (zoomed) size */}
                <div style={{ width: canvasSize.w * (zoom / 100), height: canvasSize.h * (zoom / 100), margin: '0 auto', position: 'relative' }}>
                  {/* Canvas container with CSS transform — stays at natural size, visually scaled */}
                  <div 
                    ref={containerRef} 
                    className="relative" 
                    style={{ width: canvasSize.w, height: canvasSize.h, transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
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
                    
                    <div className={"relative " + (imageLoaded && !loadError ? '' : 'opacity-0')}>
                      <canvas ref={baseCanvasRef} className="rounded-xl shadow-md block" />
                      <canvas ref={colorCanvasRef} className="absolute top-0 left-0 rounded-xl" style={{ cursor: canvasCursor }} />
                    </div>
                    {cursorPos && (tool === 'brush' || tool === 'pencil' || tool === 'eraser') && imageLoaded && !loadError && (
                      <div className="absolute pointer-events-none z-20 rounded-full border-2" style={{ left: cursorPos.x - cursorRadius, top: cursorPos.y - cursorRadius, width: cursorRadius * 2, height: cursorRadius * 2, borderColor: tool === 'eraser' ? '#666666' : selectedColor, backgroundColor: tool === 'eraser' ? 'rgba(255,255,255,0.3)' : 'transparent' }} />
                    )}
                  </div>
                </div>
              </div>

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-border">
                  <button onClick={undo} className="px-3 py-2 rounded-xl border-2 border-[#E5E0D5] text-foreground flex items-center justify-center gap-1.5 hover:border-[#FFB800] transition-all text-xs font-medium"><Undo2 className="w-3.5 h-3.5" /> Undo</button>
                  <div className="relative">
                    <button onClick={() => { if (canExportPDF(plan)) { setDlOpen(!dlOpen); } else { handleDownload(); } }} className="px-3 py-2 rounded-xl bg-[#1A1A2E] text-white flex items-center justify-center gap-1.5 hover:bg-[#1A1A2E]/90 transition-all text-xs font-medium"><Download className="w-3.5 h-3.5" /> {!isSignedIn ? 'Sign in' : 'Download'}{canExportPDF(plan) && <ChevronDown className="w-3 h-3" />}</button>
                    {dlOpen && canExportPDF(plan) && (
                      <div className="absolute bottom-full left-0 mb-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[100px] z-50">
                        <button onClick={() => { setDlOpen(false); handleDownload(); }} className="w-full px-3 py-2 text-xs text-left hover:bg-amber-50 flex items-center gap-1.5 text-[#1A1A2E]"><Download className="w-3 h-3" /> PNG</button>
                        <button onClick={() => { setDlOpen(false); handleDownloadPDF(); }} className="w-full px-3 py-2 text-xs text-left hover:bg-amber-50 flex items-center gap-1.5 text-[#FFB800]"><FileText className="w-3 h-3" /> PDF</button>
                      </div>
                    )}
                  </div>
                  <button onClick={handlePrint} className="px-3 py-2 rounded-xl border-2 border-[#E5E0D5] text-foreground flex items-center justify-center gap-1.5 hover:border-[#FFB800] transition-all text-xs font-medium"><Printer className="w-3.5 h-3.5" /> {!isSignedIn ? 'Sign in to Print' : 'Print'}</button>
                  <button onClick={handleSaveToHistory} disabled={saveStatus === 'saving'} className="px-3 py-2 rounded-xl text-[#1A1A2E] flex items-center justify-center gap-1.5 transition-all text-xs font-medium disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)' }}>
                    {saveStatus === 'saving' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Failed' : !isSignedIn ? 'Sign in to Save' : 'Save'}
                  </button>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-[#FFB800]" /></div>}>
      <ColorContent />
    </Suspense>
  );
}
