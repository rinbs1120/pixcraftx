import { Metadata } from 'next';
import Image from 'next/image';
import { themes } from '@/data/coloring-themes';

export const metadata: Metadata = {
  title: 'Free Coloring Pages - PixCraftX',
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

const categories = ['Kids Animals', 'Kids Fantasy', 'Adult Relaxation', 'Education', 'Kids Science', 'Seasonal'];

export default function FreeColoringPages() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="container mx-auto px-4 md:px-6 max-w-6xl pt-24 pb-8">
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
          Free Coloring Pages
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Browse hundreds of free printable coloring pages for kids and adults. Download your favorites or color them online!
        </p>
      </section>

      {/* Themes by Category */}
      {categories.map((category) => {
        const categoryThemes = themes.filter((t) => t.category === category);
        if (categoryThemes.length === 0) return null;

        return (
          <section key={category} className="container mx-auto px-4 md:px-6 max-w-6xl pb-12">
            <h2 className="font-display text-2xl text-foreground mb-6">
              {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryThemes.map((theme) => (
                <div
                  key={theme.slug}
                  className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  {/* Preview Image */}
                  <div className="relative aspect-[4/3] bg-white">
                    <Image
                      src={theme.samples[0]}
                      alt={theme.sampleAlts[0]}
                      fill
                      className="object-contain p-4"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>

                  {/* Info + Buttons */}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground mb-3">{theme.h1}</h3>
                    <div className="flex gap-3">
                      <a
                        href={theme.samples[0]}
                        download
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all hover:translate-y-0.5 text-[#1A1A2E] border-2 border-[#FFB800] bg-white hover:bg-[#FFF8E1]"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download
                      </a>
                      <a
                        href={`/color?src=${encodeURIComponent(`https://pixcraftx.com${theme.samples[0]}`)}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all hover:translate-y-0.5 text-[#1A1A2E]"
                        style={{
                          background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)',
                          boxShadow: '0 2px 8px rgba(255,184,0,0.3)',
                        }}
                      >
                        {/* Colorful Palette Icon */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2 0-.5-.18-.96-.5-1.33-.3-.35-.5-.81-.5-1.33 0-1.1.9-2 2-2h2.36C19.86 15.34 22 13.13 22 10c0-4.42-4.48-8-10-8z" fill="#F5F0E8" stroke="#1A1A2E" strokeWidth="1.5"/>
                          <circle cx="8" cy="9" r="1.8" fill="#FF6B6B"/>
                          <circle cx="12" cy="6.5" r="1.8" fill="#FFB800"/>
                          <circle cx="16" cy="9" r="1.8" fill="#2ECC71"/>
                          <circle cx="7.5" cy="13" r="1.8" fill="#9B59B6"/>
                          <circle cx="16.5" cy="13" r="1.8" fill="#3498DB"/>
                        </svg>
                        Color Online
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* Bottom CTA */}
      <section className="container mx-auto px-4 md:px-6 max-w-6xl pb-20">
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <h2 className="font-display text-2xl md:text-3xl text-foreground mb-4">
            Want Something Unique?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
            Use our AI generator to create custom coloring pages from any idea!
          </p>
          <a
            href="/generate"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-base transition-all hover:translate-y-0.5 text-[#1A1A2E]"
            style={{
              background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)',
              boxShadow: '0 2px 8px rgba(255,184,0,0.3)',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Generate Your Own
          </a>
        </div>
      </section>
    </div>
  );
}
