import { Metadata } from 'next';
import { FreePagesClient } from './free-pages-client';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Free Coloring Pages',
  description: 'Browse and download free printable coloring pages featuring Oriental themes — dragons, koi fish, pagodas, and more!',
  openGraph: {
    title: 'Free Coloring Pages - PixCraftX',
    description: 'Browse and download free printable coloring pages featuring Oriental and fantasy themes.',
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
        {/* Hero - centered */}
        <section className="container mx-auto px-4 md:px-6 max-w-[1300px] pt-24 pb-4 text-center">
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
            Browse Free Coloring Pages
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Explore free printable coloring pages featuring Oriental themes — from soaring dragons to moonlit pagodas. Color them, then turn into merch!
          </p>
          <a
            href="/generate"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-semibold text-base transition-all hover:translate-y-0.5 text-[#1A1A2E]"
            style={{
              background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)',
              boxShadow: '0 2px 8px rgba(255,184,0,0.3)',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Want something unique? Create it with AI
          </a>
        </section>

        <FreePagesClient />
      </main>
      <Footer />
    </>
  );
}
