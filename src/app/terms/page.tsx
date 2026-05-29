import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'Terms of Service',
  description: 'ColorForge terms of service.',
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl mb-8 text-center">
            Terms of Service
          </h1>

          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="lead mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">1. Acceptance of Terms</h2>
            <p className="leading-relaxed mb-6">
              By accessing or using ColorForge, you agree to be bound by these Terms of Service
              and all applicable laws and regulations.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">2. Use License</h2>
            <p className="leading-relaxed mb-6">
              Permission is granted to temporarily use ColorForge for personal, non-commercial
              transitory purposes only. For commercial use, you must have an active subscription
              that includes commercial rights.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">3. User Account</h2>
            <p className="leading-relaxed mb-6">
              You are responsible for safeguarding the password that you use to access ColorForge
              and for any activities or actions under your password.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">4. Generated Content</h2>
            <p className="leading-relaxed mb-6">
              You retain ownership of the text prompts you submit. The generated coloring pages
              may be used according to your subscription tier — personal use for Free tier,
              commercial use for Pro and Business tiers.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">5. Prohibited Uses</h2>
            <p className="leading-relaxed mb-6">
              You may not use ColorForge to generate content that is illegal, harmful,
              discriminatory, or infringes on the intellectual property rights of others.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">6. Payment Terms</h2>
            <p className="leading-relaxed mb-6">
              Subscriptions are billed monthly or annually in advance. You may cancel at any time,
              and your subscription will remain active until the end of the current billing period.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">7. Disclaimer</h2>
            <p className="leading-relaxed mb-6">
              ColorForge is provided on an &quot;AS IS&quot; basis without warranties of any kind.
              We do not guarantee the quality, accuracy, or suitability of generated images.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">8. Contact</h2>
            <p className="leading-relaxed">
              Questions? Contact us at{' '}
              <a href="mailto:hello@pixcraftx.com" className="text-primary hover:underline">
                hello@pixcraftx.com
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
