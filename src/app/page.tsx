import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { InviteBanner } from '@/components/invite-banner';
import { Hero } from '@/components/sections/hero';
import { PerfectFor } from '@/components/sections/perfect-for';
import { WhyPixCraftX } from '@/components/sections/why-pixcraftx';
import { Pricing } from '@/components/sections/pricing';
import { FAQ } from '@/components/sections/faq';
import { ColoringGallery } from '@/components/sections/coloring-gallery';
import { HowItWorks } from '@/components/sections/how-it-works';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <InviteBanner />
      <main>
        <Hero />
        <div id="how-it-works">
          <HowItWorks />
        </div>
        <ColoringGallery />
        <PerfectFor />
        <WhyPixCraftX />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
