import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { themes } from '@/data/coloring-themes';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Free Coloring Pages',
  description: 'Browse and download free printable coloring pages for kids and adults. Dinosaurs, unicorns, mandalas, and more!',
  openGraph: {
    title: 'Free Coloring Pages - PixCraftX',
    description: 'Browse and download free printable coloring pages for kids and adults.',
    url: 'https://pixcraftx.com/free-coloring-pages',
    siteName: 'PixCraftX',
    type: 'website',
  },
  alternates: {
    canonical: 'https://pixcraftx.com/free-coloring-pages',
  },
};

export default function FreeColoringPages() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero + CTA */}
        <section className="container mx-auto px-4 md:px-6 max-w-6xl pt-24 pb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
                Free Coloring Pages
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Browse hundreds of free printable coloring pages. Download or color online instantly!
              </p>
            </div>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-semibold text-base transition-all hover:translate-y-0.5 text-[#1A1A2E] flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)',
                boxShadow: '0 2px 8px rgba(255,184,0,0.3)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Generate Your Own
            </Link>
          </div>
        </section>

        {/* Compact Grid */}
        <section className="container mx-auto px-4 md:px-6 max-w-6xl pb-20">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {themes.map((theme) => (
              <div
                key={theme.slug}
                className="group bg-white rounded-2xl overflow-hidden border-2 border-transparent hover:border-[#FFB800] hover:shadow-xl hover:scale-[1.03] transition-all duration-300"
                style={{ boxShadow: '0 4px 12px rgba(26,26,46,0.08)' }}
              >
                {/* Image */}
                <div className="relative w-full aspect-[3/2] bg-[#FFFBF0]">
                  <Image
                    src={theme.samples[0]}
                    alt={theme.sampleAlts[0]}
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />
                </div>
                {/* Title + Buttons */}
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-foreground truncate mb-2">{theme.h1}</p>
                  <div className="flex gap-1.5">
                    <a
                      href={theme.samples[0]}
                      download
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-full font-semibold text-[10px] transition-all text-[#1A1A2E] border border-[#FFB800] bg-white hover:bg-[#FFF8E1]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download
                    </a>
                    <a
                      href={"/color?src=" + encodeURIComponent("https://pixcraftx.com" + theme.samples[0])}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-full font-semibold text-[10px] transition-all text-[#1A1A2E]"
                      style={{
                        background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)',
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2 0-.5-.18-.96-.5-1.33-.3-.35-.5-.81-.5-1.33 0-1.1.9-2 2-2h2.36C19.86 15.34 22 13.13 22 10c0-4.42-4.48-8-10-8z" fill="#F5F0E8" stroke="#1A1A2E" strokeWidth="1.5"/>
                        <circle cx="8" cy="9" r="1.8" fill="#FF6B6B"/>
                        <circle cx="12" cy="6.5" r="1.8" fill="#FFB800"/>
                        <circle cx="16" cy="9" r="1.8" fill="#2ECC71"/>
                        <circle cx="7.5" cy="13" r="1.8" fill="#9B59B6"/>
                        <circle cx="16.5" cy="13" r="1.8" fill="#3498DB"/>
                      </svg>
                      Color
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
