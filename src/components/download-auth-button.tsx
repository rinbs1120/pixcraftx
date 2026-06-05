'use client';

import { useState } from 'react';
import { useAuth, SignIn } from '@clerk/nextjs';

export function DownloadAuthButton({ href }: { href: string }) {
  const { isSignedIn } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);

  if (isSignedIn) {
    return (
      <a
        href={href}
        download
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full font-semibold text-sm transition-all hover:translate-y-0.5 text-[#1A1A2E]"
        style={{
          background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)',
          boxShadow: '0 2px 8px rgba(255,184,0,0.3)',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download Free
      </a>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowSignIn(true)}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full font-semibold text-sm transition-all hover:translate-y-0.5 text-[#1A1A2E]"
        style={{
          background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)',
          boxShadow: '0 2px 8px rgba(255,184,0,0.3)',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download Free
      </button>
      {showSignIn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowSignIn(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
            <h3 className="font-display text-xl mb-4 text-center text-foreground">Sign in to Download</h3>
            <SignIn routing="hash" />
          </div>
        </div>
      )}
    </>
  );
}
