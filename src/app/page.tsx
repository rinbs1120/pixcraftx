import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Hero } from '@/components/sections/hero';
import { StyleShowcase } from '@/components/sections/style-showcase';
import { HowItWorks } from '@/components/sections/how-it-works';
import { PerfectFor } from '@/components/sections/perfect-for';
import { WhyColorForge } from '@/components/sections/why-colorforge';
import { Pricing } from '@/components/sections/pricing';
import { FAQ } from '@/components/sections/faq';
import { CTA } from '@/components/sections/cta';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <StyleShowcase />
        <HowItWorks />
        <PerfectFor />
        <WhyColorForge />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
