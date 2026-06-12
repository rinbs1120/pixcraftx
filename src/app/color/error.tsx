'use client';

import { useEffect } from 'react';

export default function ColorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Silently consume - this typically happens when navigating away from canvas page
    console.warn('Color page error (likely unmount):', error.message);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <h2 className="text-2xl font-bold text-foreground mb-4">Something went wrong</h2>
      <p className="text-muted-foreground mb-6">The coloring page encountered an error.</p>
      <button
        onClick={reset}
        className="px-6 py-3 rounded-full font-semibold text-[#1A1A2E] hover:translate-y-0.5 transition-all"
        style={{
          background: '#FFB800',
          boxShadow: '0 2px 8px rgba(255,184,0,0.3)',
        }}
      >
        Try Again
      </button>
    </div>
  );
}
