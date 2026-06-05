'use client';

import { useEffect, useRef } from 'react';

const CRAYON_COLORS = ['#FFB800', '#FF6B6B', '#2ECC71', '#9B59B6', '#FFB800'];
const MAX_PARTICLES = 50;

interface Particle {
  x: number;
  y: number;
  color: string;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const colorIndexRef = useRef(0);
  const rafRef = useRef<number>(0);
  const isTouchRef = useRef(false);

  useEffect(() => {
    // Skip on touch devices
    if (typeof window === 'undefined') return;
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      isTouchRef.current = true;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };

      // Add a new particle at cursor position
      const particles = particlesRef.current;
      const color = CRAYON_COLORS[colorIndexRef.current % CRAYON_COLORS.length];
      colorIndexRef.current++;

      const size = 4 + Math.random() * 6; // 4-10px, crayon-like variation
      const maxLife = 25 + Math.random() * 15; // frames to live

      if (particles.length >= MAX_PARTICLES) {
        // Replace the oldest particle
        particles.shift();
      }

      particles.push({
        x: e.clientX + (Math.random() - 0.5) * 4,
        y: e.clientY + (Math.random() - 0.5) * 4,
        color,
        size,
        opacity: 0.7 + Math.random() * 0.3,
        life: 0,
        maxLife,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        // Fade out as life progresses
        const progress = p.life / p.maxLife;
        p.opacity = (1 - progress) * 0.8;

        // Slightly shrink as it fades
        const currentSize = p.size * (1 - progress * 0.3);

        // Draw crayon-like dot with soft edge
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        // Slight blur for crayon texture feel
        ctx.filter = 'blur(1px)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner brighter core for crayon texture
        ctx.filter = 'none';
        ctx.globalAlpha = p.opacity * 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Don't render canvas on touch devices
  if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      aria-hidden="true"
      style={{ mixBlendMode: 'multiply' }}
    />
  );
}
