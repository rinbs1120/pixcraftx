'use client';

import { useAuth, useClerk } from '@clerk/nextjs';
import { useState, useEffect, useRef } from 'react';
import { downloadPNG, downloadPDF, canExportPDF } from '@/lib/download-utils';
import { FileText, Loader2, ChevronDown } from 'lucide-react';

export function DownloadAuthButton({ href, compact = false }: { href: string; compact?: boolean }) {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const [plan, setPlan] = useState('free');
  const [downloading, setDownloading] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/usage')
        .then(res => res.json())
        .then(data => { if (data.plan) setPlan(data.plan); })
        .catch(() => {});
    }
  }, [isSignedIn]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleDownloadPNG = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    setOpen(false);
    setDownloading(true);
    try {
      const filename = `pixcraftx-${Date.now()}`;
      await downloadPNG(href, filename, plan);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPDF = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    setDownloading(true);
    try {
      const filename = `pixcraftx-${Date.now()}`;
      await downloadPDF(href, filename);
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const showPDF = canExportPDF(plan);

  if (compact) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => { if (!isSignedIn) { openSignIn(); return; } if (showPDF) { setOpen(!open); } else { handleDownloadPNG({ preventDefault: () => {}, stopPropagation: () => {} } as React.MouseEvent); } }}
          disabled={downloading}
          className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-full font-semibold text-[10px] transition-all text-[#1A1A2E] border border-[#FFB800] bg-white hover:bg-[#FFF8E1] disabled:opacity-50"
        >
          {downloading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : (
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          )}
          Download
          {showPDF && <ChevronDown className="w-2.5 h-2.5" />}
        </button>
        {open && showPDF && (
          <div className="absolute bottom-full left-0 mb-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[80px] z-50">
            <button onClick={handleDownloadPNG} className="w-full px-3 py-1.5 text-[10px] text-left hover:bg-amber-50 flex items-center gap-1.5 text-[#1A1A2E]">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              PNG
            </button>
            <button onClick={handleDownloadPDF} className="w-full px-3 py-1.5 text-[10px] text-left hover:bg-amber-50 flex items-center gap-1.5 text-[#FFB800]">
              <FileText className="w-2.5 h-2.5" /> PDF
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => { if (!isSignedIn) { openSignIn(); return; } if (showPDF) { setOpen(!open); } else { handleDownloadPNG({ preventDefault: () => {}, stopPropagation: () => {} } as React.MouseEvent); } }}
        disabled={downloading}
        className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-all hover:translate-y-0.5 text-[#1A1A2E] disabled:opacity-50"
        style={{
          background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)',
          boxShadow: '0 2px 8px rgba(255,184,0,0.3)',
        }}
      >
        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}
        Download
        {showPDF && <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && showPDF && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[120px] z-50">
          <button onClick={handleDownloadPNG} className="w-full px-4 py-2 text-sm text-left hover:bg-amber-50 flex items-center gap-2 text-[#1A1A2E]">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            PNG
          </button>
          <button onClick={handleDownloadPDF} className="w-full px-4 py-2 text-sm text-left hover:bg-amber-50 flex items-center gap-2 text-[#FFB800]">
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      )}
    </div>
  );
}
