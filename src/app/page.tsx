import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Hero } from '@/components/sections/hero';
import { TryItNow } from '@/components/sections/try-it-now';
import { HowItWorks } from '@/components/sections/how-it-works';
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
        <TryItNow />
        <HowItWorks />
        <WhyColorForge />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
