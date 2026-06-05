import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Hero } from '@/components/sections/hero';
import { ColoringGallery } from '@/components/sections/coloring-gallery';
import { StyleShowcase } from '@/components/sections/style-showcase';
import { HowItWorks } from '@/components/sections/how-it-works';
import { PerfectFor } from '@/components/sections/perfect-for';
import { WhyPixCraftX } from '@/components/sections/why-pixcraftx';
import { Pricing } from '@/components/sections/pricing';
import { FAQ } from '@/components/sections/faq';
import { CTA } from '@/components/sections/cta';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ColoringGallery />
        <StyleShowcase />
        <HowItWorks />
        <PerfectFor />
        <WhyPixCraftX />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
