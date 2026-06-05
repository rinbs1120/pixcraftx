import { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { FreeColoringGallery } from '@/components/sections/free-coloring-gallery';
import { themes } from '@/data/coloring-themes';

export const metadata: Metadata = {
  title: 'Free Coloring Pages - Printable & Online | PixCraftX',
  description: 'Browse hundreds of free printable coloring pages across popular themes. Dinosaurs, unicorns, mandalas, alphabet, and more. Color online or download for free.',
  keywords: ['free coloring pages', 'printable coloring pages', 'coloring pages for kids', 'adult coloring pages', 'mandala coloring pages', 'dinosaur coloring pages', 'unicorn coloring pages'],
  openGraph: {
    title: 'Free Coloring Pages - Printable & Online | PixCraftX',
    description: 'Browse hundreds of free printable coloring pages across popular themes. Color online or download for free.',
    url: 'https://pixcraftx.com/free-coloring-pages',
    siteName: 'PixCraftX',
    type: 'website',
  },
  alternates: {
    canonical: 'https://pixcraftx.com/free-coloring-pages',
  },
};

const categories = ['All', ...Array.from(new Set(themes.map(t => t.category)))];

export default function FreeColoringPagesPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <nav className="container mx-auto px-4 md:px-6 max-w-6xl pt-24 pb-4">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <a href="/" className="hover:text-primary transition-colors">PixCraftX</a>
            </li>
            <li className="text-muted-foreground/50">/</li>
            <li className="text-foreground font-medium">Free Coloring Pages</li>
          </ol>
        </nav>

        <section className="container mx-auto px-4 md:px-6 max-w-6xl pb-8">
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
            Free Coloring Pages
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mb-8">
            Browse hundreds of free printable coloring pages across popular themes. Download for free or color online — no signup required.
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href="/generate"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-lg transition-all hover:translate-y-0.5 text-[#1A1A2E]"
              style={{
                background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)',
                boxShadow: '0 4px 16px rgba(255,184,0,0.4)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Generate Your Own
            </a>
            <a
              href="/color"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-lg transition-all hover:translate-y-0.5 border-2 border-[#FFB800] text-[#1A1A2E] bg-white hover:bg-[#FFF8E1]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        </section>

        <FreeColoringGallery categories={categories} />

        <section className="container mx-auto px-4 md:px-6 max-w-6xl py-16">
          <div className="max-w-3xl">
            <h2 className="font-display text-2xl text-foreground mb-4">
              About Our Free Coloring Pages
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              PixCraftX offers a growing collection of free printable coloring pages for kids and adults. From adorable dinosaurs and magical unicorns to intricate mandalas and educational alphabet sheets, every page is designed with bold, clean outlines that are perfect for coloring. All pages are free to download and print — or color them online right in your browser. Want something unique? Use our AI generator to create custom coloring pages from any idea!
            </p>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
