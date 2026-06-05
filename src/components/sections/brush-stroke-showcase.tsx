'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Stroke definition type
interface Stroke {
  points: { x: number; y: number }[];
  width: number;
  color: string;
  delay: number; // ms delay before this stroke starts
}

// Style definitions
interface StyleDef {
  name: string;
  tagline: string;
  color: string;
  strokes: Stroke[];
}

// Generate bezier curve points for natural-looking strokes
function generateStrokes(styleId: string): Stroke[] {
  const strokes: Stroke[] = [];

  if (styleId === 'simple') {
    // Simple: Bold & Easy - thick strokes, warm colors, large areas
    const colors = ['#FFB800', '#FF6B6B', '#2ECC71', '#FF9F43', '#FFD93D', '#FF6B6B', '#2ECC71', '#FFB800'];
    const regions = [
      // Large sweeping strokes covering different areas
      { cx: 0.3, cy: 0.25, rx: 0.18, ry: 0.12 },
      { cx: 0.7, cy: 0.25, rx: 0.15, ry: 0.13 },
      { cx: 0.5, cy: 0.5, rx: 0.2, ry: 0.15 },
      { cx: 0.25, cy: 0.6, rx: 0.12, ry: 0.14 },
      { cx: 0.75, cy: 0.6, rx: 0.14, ry: 0.12 },
      { cx: 0.35, cy: 0.8, rx: 0.16, ry: 0.1 },
      { cx: 0.65, cy: 0.8, rx: 0.13, ry: 0.11 },
      { cx: 0.5, cy: 0.35, rx: 0.1, ry: 0.08 },
    ];
    for (let i = 0; i < regions.length; i++) {
      const r = regions[i];
      const numStrokes = 3;
      for (let j = 0; j < numStrokes; j++) {
        const angle = (j / numStrokes) * Math.PI * 2 + i * 0.5;
        const startX = r.cx + Math.cos(angle) * r.rx * 0.3;
        const startY = r.cy + Math.sin(angle) * r.ry * 0.3;
        const endX = r.cx - Math.cos(angle) * r.rx * 0.5;
        const endY = r.cy - Math.sin(angle) * r.ry * 0.5;
        const cpX1 = r.cx + Math.cos(angle + 0.8) * r.rx * 0.6;
        const cpY1 = r.cy + Math.sin(angle + 0.8) * r.ry * 0.6;
        strokes.push({
          points: [
            { x: startX, y: startY },
            { x: cpX1, y: cpY1 },
            { x: endX, y: endY },
          ],
          width: 25 + Math.random() * 15,
          color: colors[i % colors.length],
          delay: i * numStrokes * 350 + j * 300,
        });
      }
    }
  } else if (styleId === 'patterned') {
    // Patterned: medium strokes, cool colors, regular fill pattern
    const colors = ['#9B59B6', '#3498DB', '#1ABC9C', '#E84393', '#6C5CE7', '#3498DB', '#9B59B6', '#1ABC9C'];
    const regions = [
      { cx: 0.3, cy: 0.2, rx: 0.12, ry: 0.1 },
      { cx: 0.7, cy: 0.2, rx: 0.12, ry: 0.1 },
      { cx: 0.5, cy: 0.4, rx: 0.15, ry: 0.12 },
      { cx: 0.2, cy: 0.55, rx: 0.1, ry: 0.12 },
      { cx: 0.8, cy: 0.55, rx: 0.1, ry: 0.12 },
      { cx: 0.35, cy: 0.75, rx: 0.13, ry: 0.1 },
      { cx: 0.65, cy: 0.75, rx: 0.13, ry: 0.1 },
      { cx: 0.5, cy: 0.9, rx: 0.12, ry: 0.06 },
    ];
    for (let i = 0; i < regions.length; i++) {
      const r = regions[i];
      const numStrokes = 4;
      for (let j = 0; j < numStrokes; j++) {
        const angle = (j / numStrokes) * Math.PI * 2;
        const startX = r.cx + Math.cos(angle) * r.rx * 0.2;
        const startY = r.cy + Math.sin(angle) * r.ry * 0.2;
        const midX = r.cx + Math.cos(angle + 1.2) * r.rx * 0.7;
        const midY = r.cy + Math.sin(angle + 1.2) * r.ry * 0.7;
        const endX = r.cx + Math.cos(angle + 2.4) * r.rx * 0.4;
        const endY = r.cy + Math.sin(angle + 2.4) * r.ry * 0.4;
        strokes.push({
          points: [
            { x: startX, y: startY },
            { x: midX, y: midY },
            { x: endX, y: endY },
          ],
          width: 18 + Math.random() * 10,
          color: colors[i % colors.length],
          delay: i * numStrokes * 280 + j * 250,
        });
      }
    }
  } else {
    // Realistic: fine strokes, natural colors, lots of detail
    const colors = ['#27AE60', '#8B4513', '#E67E22', '#2980B9', '#27AE60', '#8B4513', '#E67E22', '#2980B9', '#27AE60', '#8B4513'];
    const regions = [
      { cx: 0.3, cy: 0.2, rx: 0.1, ry: 0.08 },
      { cx: 0.55, cy: 0.2, rx: 0.08, ry: 0.09 },
      { cx: 0.75, cy: 0.22, rx: 0.09, ry: 0.07 },
      { cx: 0.4, cy: 0.4, rx: 0.12, ry: 0.1 },
      { cx: 0.65, cy: 0.42, rx: 0.1, ry: 0.09 },
      { cx: 0.25, cy: 0.58, rx: 0.08, ry: 0.1 },
      { cx: 0.5, cy: 0.6, rx: 0.1, ry: 0.08 },
      { cx: 0.75, cy: 0.58, rx: 0.09, ry: 0.1 },
      { cx: 0.35, cy: 0.78, rx: 0.1, ry: 0.07 },
      { cx: 0.65, cy: 0.78, rx: 0.09, ry: 0.08 },
    ];
    for (let i = 0; i < regions.length; i++) {
      const r = regions[i];
      const numStrokes = 5;
      for (let j = 0; j < numStrokes; j++) {
        const angle = (j / numStrokes) * Math.PI * 2 + i * 0.3;
        const startX = r.cx + Math.cos(angle) * r.rx * 0.1;
        const startY = r.cy + Math.sin(angle) * r.ry * 0.1;
        const cp1X = r.cx + Math.cos(angle + 0.5) * r.rx * 0.5;
        const cp1Y = r.cy + Math.sin(angle + 0.5) * r.ry * 0.5;
        const cp2X = r.cx + Math.cos(angle + 1.5) * r.rx * 0.7;
        const cp2Y = r.cy + Math.sin(angle + 1.5) * r.ry * 0.7;
        const endX = r.cx + Math.cos(angle + 2.5) * r.rx * 0.3;
        const endY = r.cy + Math.sin(angle + 2.5) * r.ry * 0.3;
        strokes.push({
          points: [
            { x: startX, y: startY },
            { x: cp1X, y: cp1Y },
            { x: cp2X, y: cp2Y },
            { x: endX, y: endY },
          ],
          width: 10 + Math.random() * 10,
          color: colors[i % colors.length],
          delay: i * numStrokes * 220 + j * 200,
        });
      }
    }
  }

  return strokes;
}

const STYLE_CONFIG = {
  simple: {
    name: 'Simple',
    tagline: 'Bold & Easy',
    color: '#FFB800',
  },
  patterned: {
    name: 'Patterned',
    tagline: 'Relaxing & Symmetrical',
    color: '#9B59B6',
  },
  realistic: {
    name: 'Realistic',
    tagline: 'Detailed & Immersive',
    color: '#2ECC71',
  },
};

type StyleKey = keyof typeof STYLE_CONFIG;

export function BrushStrokeShowcase() {
  const [activeStyle, setActiveStyle] = useState<StyleKey>('simple');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeIndexRef = useRef(0);
  const strokeProgressRef = useRef(0);
  const phaseRef = useRef<'drawing' | 'holding' | 'fading' | 'resetting'>('drawing');
  const holdTimerRef = useRef(0);
  const fadeOpacityRef = useRef(1);
  const lastTimeRef = useRef(0);
  const lineArtLoadedRef = useRef(false);
  const lineArtImageRef = useRef<HTMLImageElement | null>(null);

  // Load line art image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      lineArtImageRef.current = img;
      lineArtLoadedRef.current = true;
    };
    img.src = '/styles/simple.jpg';
  }, []);

  // Reset animation when style changes
  const resetAnimation = useCallback(() => {
    strokesRef.current = generateStrokes(activeStyle);
    currentStrokeIndexRef.current = 0;
    strokeProgressRef.current = 0;
    phaseRef.current = 'drawing';
    holdTimerRef.current = 0;
    fadeOpacityRef.current = 1;
  }, [activeStyle]);

  useEffect(() => {
    resetAnimation();
  }, [activeStyle, resetAnimation]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DRAW_DURATION = 300; // ms per stroke
    const HOLD_DURATION = 3000; // ms to hold after complete
    const FADE_DURATION = 1000; // ms to fade out

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const w = canvas.width;
      const h = canvas.height;

      // Clear and draw line art
      ctx.clearRect(0, 0, w, h);

      // Draw white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);

      // Draw line art if loaded
      if (lineArtImageRef.current) {
        const img = lineArtImageRef.current;
        // Fit image maintaining aspect ratio
        const scale = Math.min(w / img.width, h / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const drawX = (w - drawW) / 2;
        const drawY = (h - drawH) / 2;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      }

      // Apply global alpha for fading
      ctx.globalAlpha = fadeOpacityRef.current;

      // Draw completed strokes
      const strokes = strokesRef.current;
      const currentIndex = currentStrokeIndexRef.current;

      for (let i = 0; i < currentIndex && i < strokes.length; i++) {
        drawStroke(ctx, strokes[i], 1, w, h);
      }

      // Draw current stroke being animated
      if (phaseRef.current === 'drawing' && currentIndex < strokes.length) {
        drawStroke(ctx, strokes[currentIndex], strokeProgressRef.current, w, h);
      }

      ctx.globalAlpha = 1;

      // Update animation state
      if (phaseRef.current === 'drawing') {
        if (currentIndex < strokes.length) {
          strokeProgressRef.current += delta / DRAW_DURATION;
          if (strokeProgressRef.current >= 1) {
            strokeProgressRef.current = 0;
            currentStrokeIndexRef.current++;
            // Wait for delay before next stroke
            if (currentStrokeIndexRef.current < strokes.length) {
              const nextDelay = strokes[currentStrokeIndexRef.current].delay -
                (currentIndex > 0 ? strokes[currentIndex].delay : 0);
              if (nextDelay > 0) {
                // We'll handle delay by just advancing the timer
              }
            }
          }
        } else {
          phaseRef.current = 'holding';
          holdTimerRef.current = 0;
        }
      } else if (phaseRef.current === 'holding') {
        holdTimerRef.current += delta;
        if (holdTimerRef.current >= HOLD_DURATION) {
          phaseRef.current = 'fading';
        }
      } else if (phaseRef.current === 'fading') {
        fadeOpacityRef.current -= delta / FADE_DURATION;
        if (fadeOpacityRef.current <= 0) {
          fadeOpacityRef.current = 0;
          phaseRef.current = 'resetting';
        }
      } else if (phaseRef.current === 'resetting') {
        // Reset and start over
        currentStrokeIndexRef.current = 0;
        strokeProgressRef.current = 0;
        phaseRef.current = 'drawing';
        holdTimerRef.current = 0;
        fadeOpacityRef.current = 1;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [activeStyle, resetAnimation]);

  // Draw a single stroke with given progress (0-1)
  function drawStroke(
    ctx: CanvasRenderingContext2D,
    stroke: Stroke,
    progress: number,
    canvasW: number,
    canvasH: number
  ) {
    if (stroke.points.length < 2) return;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Calculate how many segments to draw based on progress
    const totalSegments = stroke.points.length - 1;
    const segmentsToDraw = progress * totalSegments;

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;

    // Shadow for crayon effect
    ctx.shadowBlur = 3;
    ctx.shadowColor = stroke.color;

    // Semi-transparent for crayon texture feel
    const baseAlpha = ctx.globalAlpha;
    ctx.globalAlpha = baseAlpha * 0.75;

    ctx.beginPath();

    const pts = stroke.points.map((p) => ({
      x: p.x * canvasW,
      y: p.y * canvasH,
    }));

    ctx.moveTo(pts[0].x, pts[0].y);

    for (let i = 0; i < totalSegments; i++) {
      const segProgress = Math.min(1, segmentsToDraw - i);
      if (segProgress <= 0) break;

      if (i === 0 && stroke.points.length === 3) {
        // Quadratic bezier
        const cpX = pts[1].x;
        const cpY = pts[1].y;
        const endX = pts[0].x + (pts[2].x - pts[0].x) * segProgress;
        const endY = pts[0].y + (pts[2].y - pts[0].y) * segProgress;
        // Approximate partial bezier
        const t = segProgress;
        const qX = (1 - t) * (1 - t) * pts[0].x + 2 * (1 - t) * t * cpX + t * t * pts[2].x;
        const qY = (1 - t) * (1 - t) * pts[0].y + 2 * (1 - t) * t * cpY + t * t * pts[2].y;
        ctx.quadraticCurveTo(cpX * t, cpY * t, qX, qY);
      } else if (i === 0 && stroke.points.length === 4) {
        // Cubic bezier - draw partial
        const t = segProgress;
        const bX = cubicBezier(pts[0].x, pts[1].x, pts[2].x, pts[3].x, t);
        const bY = cubicBezier(pts[0].y, pts[1].y, pts[2].y, pts[3].y, t);
        ctx.lineTo(bX, bY);
      } else {
        const endX = pts[i].x + (pts[i + 1].x - pts[i].x) * segProgress;
        const endY = pts[i].y + (pts[i + 1].y - pts[i].y) * segProgress;
        ctx.lineTo(endX, endY);
      }
    }

    ctx.stroke();
    ctx.restore();
  }

  function cubicBezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
    const mt = 1 - t;
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
  }

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const dpr = 1; // Use 1 for performance
      canvas.width = rect.width * dpr;
      canvas.height = rect.width * 1.33 * dpr; // 3:4 aspect ratio
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.width * 1.33 + 'px';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const styleKeys: StyleKey[] = ['simple', 'patterned', 'realistic'];

  // Calculate progress for indicator dots
  const totalStrokes = strokesRef.current.length;
  const currentStroke = currentStrokeIndexRef.current;

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
            Watch the Magic Happen
          </h2>
          <p className="text-muted-foreground text-lg">
            See how coloring pages come to life
          </p>
        </div>

        {/* Style Switcher Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {styleKeys.map((key) => {
            const config = STYLE_CONFIG[key];
            const isActive = activeStyle === key;
            return (
              <button
                key={key}
                onClick={() => setActiveStyle(key)}
                className={`flex flex-col items-center px-6 py-3 rounded-2xl border-2 transition-all ${
                  isActive
                    ? 'border-[#FFB800] bg-[#FFF3CC] shadow-md'
                    : 'border-[#E5E0D5] bg-white hover:border-[#FFB800]/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <span
                    className={`font-semibold text-sm ${
                      isActive ? 'text-[#FFB800]' : 'text-foreground'
                    }`}
                  >
                    {config.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {config.tagline}
                </span>
              </button>
            );
          })}
        </div>

        {/* Canvas Area */}
        <div className="max-w-lg mx-auto">
          <div
            className="rounded-3xl overflow-hidden border-2 border-[#E5E0D5] shadow-lg"
            style={{ background: '#FFFBF0' }}
          >
            <canvas
              ref={canvasRef}
              className="w-full"
              style={{ display: 'block' }}
            />
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {styleKeys.map((key) => {
              const config = STYLE_CONFIG[key];
              return (
                <button
                  key={key}
                  onClick={() => setActiveStyle(key)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    activeStyle === key ? 'scale-125' : 'opacity-40 hover:opacity-70'
                  }`}
                  style={{ backgroundColor: config.color }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
