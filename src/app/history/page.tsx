'use client';

import { useState, useEffect, Suspense } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Loader2, Download, Trash2, Sparkles, Image as ImageIcon, Palette } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface GenerationRecord {
  id: number;
  prompt: string;
  style: string;
  image_url: string;
  storage_path: string | null;
  created_at: string;
}

function HistoryContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<GenerationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push('/generate');
      return;
    }
    fetchHistory();
  }, [isSignedIn, isLoaded]);

  const fetchHistory = async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { session } } = await supabase.auth.getSession();
    
    // Use REST API with service role via a different approach
    // Since we don't have Clerk-Supabase integration, use the API route
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `colorforge-${prompt.slice(0, 30).replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this page?')) return;
    try {
      const res = await fetch('/api/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setRecords(records.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const styleLabels: Record<string, string> = {
    kids: 'Kids',
    mandala: 'Mandala',
    detailed: 'Detailed',
  };

  if (!isLoaded || loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFB800]" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
                My Coloring Pages
              </h1>
              <p className="text-muted-foreground">
                {records.length} page{records.length !== 1 ? 's' : ''} created
              </p>
            </div>
            <button
              onClick={() => router.push('/generate')}
              className="px-6 py-3 font-semibold rounded-full text-[#1A1A2E] hover:-translate-y-0.5 transition-all flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)', boxShadow: '0 4px 16px rgba(255,107,107,0.3)' }}
            >
              <Sparkles className="w-4 h-4" />
              Create New
            </button>
          </div>

          {/* Grid */}
          {records.length === 0 ? (
            <div className="text-center py-20">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-[#FFB800]/40" />
              <p className="text-lg font-medium text-foreground mb-2">No coloring pages yet</p>
              <p className="text-muted-foreground mb-6">Start creating your first coloring page!</p>
              <button
                onClick={() => router.push('/generate')}
                className="px-6 py-3 font-semibold rounded-full text-[#1A1A2E]"
                style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)' }}
              >
                Get Started
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border group transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  {/* Image */}
                  <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden">
                    <img
                      src={record.image_url}
                      alt={record.prompt}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                        (e.target as HTMLImageElement).alt = 'Image unavailable';
                      }}
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <a
                        href={\`/color?src=\${encodeURIComponent(record.image_url)}\`}
                        className="p-2 bg-white rounded-full shadow-md hover:bg-amber-50"
                        title="Color It"
                      >
                        <Palette className="w-4 h-4 text-[#FFB800]" />
                      </a>
                      <button
                        onClick={() => handleDownload(record.image_url, record.prompt)}
                        className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-[#1A1A2E]" />
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="p-2 bg-white rounded-full shadow-md hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#FFB800]/10 text-[#FFB800]">
                        {styleLabels[record.style] || record.style}
                      </span>
                    </div>
                    <p className="text-sm text-[#4A4A5E] line-clamp-2">
                      {record.prompt}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(record.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFB800]" />
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}
