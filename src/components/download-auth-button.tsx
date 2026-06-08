'use client';

import { useAuth, useClerk } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { downloadPNG, downloadPDF, canExportPDF } from '@/lib/download-utils';
import { FileText, Loader2 } from 'lucide-react';

export function DownloadAuthButton({ href, compact = false }: { href: string; compact?: boolean }) {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const [plan, setPlan] = useState('free');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/usage')
        .then(res => res.json())
        .then(data => { if (data.plan) setPlan(data.plan); })
        .catch(() => {});
    }
  }, [isSignedIn]);

  const handleDownload = async (e: React.MouseEvent) => {
    if (!isSignedIn) {
      e.preventDefault();
      openSignIn();
      return;
    }
    e.preventDefault();
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

  if (compact) {
    return (
      <div className="flex gap-1">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-full font-semibold text-[10px] transition-all text-[#1A1A2E] border border-[#FFB800] bg-white hover:bg-[#FFF8E1] disabled:opacity-50"
        >
          {downloading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : (
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          )}
          PNG
        </button>
        {canExportPDF(plan) && (
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-full font-semibold text-[10px] transition-all text-[#FFB800] border border-[#FFB800] bg-white hover:bg-[#FFF8E1] disabled:opacity-50"
          >
            <FileText className="w-2.5 h-2.5" />
            PDF
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-full font-semibold text-sm transition-all hover:translate-y-0.5 text-[#1A1A2E] disabled:opacity-50"
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
        Download PNG
      </button>
      {canExportPDF(plan) && (
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all border-2 border-[#FFB800] text-[#FFB800] hover:bg-[#FFB800]/10 disabled:opacity-50"
        >
          <FileText className="w-4 h-4" />
          PDF
        </button>
      )}
    </div>
  );
}
