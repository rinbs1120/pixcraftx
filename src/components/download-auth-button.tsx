'use client';

import { useAuth, useClerk } from '@clerk/nextjs';

export function DownloadAuthButton({ href, compact = false }: { href: string; compact?: boolean }) {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  const handleClick = (e: React.MouseEvent) => {
    if (!isSignedIn) {
      e.preventDefault();
      openSignIn();
    }
  };

  if (compact) {
    return (
      <a
        href={isSignedIn ? href : undefined}
        download={isSignedIn}
        onClick={handleClick}
        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-full font-semibold text-[10px] transition-all text-[#1A1A2E] border border-[#FFB800] bg-white hover:bg-[#FFF8E1]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download
      </a>
    );
  }

  // Full-width variant (detail page)
  return (
    <a
      href={isSignedIn ? href : undefined}
      download={isSignedIn}
      onClick={handleClick}
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
