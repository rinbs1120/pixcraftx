import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'Privacy Policy',
  description: 'ColorForge privacy policy.',
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl mb-8 text-center">
            Privacy Policy
          </h1>

          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="lead mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">1. Information We Collect</h2>
            <p className="leading-relaxed mb-6">
              We collect information you provide directly to us, such as when you create an account,
              subscribe to our services, or contact us for support. This may include your name,
              email address, and payment information.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">2. How We Use Information</h2>
            <p className="leading-relaxed mb-6">
              We use the information we collect to provide, maintain, and improve our services,
              to communicate with you, and to protect against fraud and abuse.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">3. Information Sharing</h2>
            <p className="leading-relaxed mb-6">
              We do not sell your personal information. We may share your information with
              third-party service providers who assist us in operating our services, subject
              to confidentiality agreements.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">4. Data Security</h2>
            <p className="leading-relaxed mb-6">
              We implement appropriate technical and organizational measures to protect your
              personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">5. Your Rights</h2>
            <p className="leading-relaxed mb-6">
              You may access, correct, or delete your personal information at any time by
              contacting us or through your account settings.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">6. Contact Us</h2>
            <p className="leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at{' '}
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
