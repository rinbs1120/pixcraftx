import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Pricing as PricingSection } from '@/components/sections/pricing';
import { CTA } from '@/components/sections/cta';

export const metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for PixCraftX coloring page generator.',
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 bg-background">
        <PricingSection />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
