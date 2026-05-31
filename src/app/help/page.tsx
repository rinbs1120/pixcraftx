import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'Help Center',
  description: 'ColorForge help center and contact information.',
};

export default function HelpPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl mb-8 text-center">
            Help Center
          </h1>

          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="leading-relaxed mb-6">
              Need help with ColorForge? You&apos;re in the right place. Below you&apos;ll find answers to common questions and ways to reach us.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              Quick Answers
            </h2>

            <p className="leading-relaxed mb-6">
              Most questions are answered in our <a href="/faq" className="text-[#FFB800] hover:underline">FAQ page</a>, including how to generate pages, available styles, pricing, and cancellation.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              Common Issues
            </h2>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              Image Generation Failed
            </h3>
            <p className="leading-relaxed mb-6">
              If your prompt could not be processed, it may have triggered our content moderation system. Please revise your description and try again. Avoid any prompts involving violence, hate, or inappropriate content.
            </p>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              Monthly Limit Reached
            </h3>
            <p className="leading-relaxed mb-6">
              Free accounts can generate up to 5 pages per month. To get more, check out our <a href="/pricing" className="text-[#FFB800] hover:underline">Pricing plans</a>.
            </p>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              Billing or Refund Questions
            </h3>
            <p className="leading-relaxed mb-6">
              For payment issues or refund requests, please see our <a href="/refund" className="text-[#FFB800] hover:underline">Refund Policy</a> for details.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              Contact Us
            </h2>

            <p className="leading-relaxed mb-6">
              Can&apos;t find what you need? We&apos;re happy to help. Send us an email and we&apos;ll get back to you within 1-2 business days.
            </p>

            <div className="bg-[#1A1A2E] rounded-lg p-6 my-8 text-center">
              <p className="text-lg text-[#FFFBF0] mb-2">Email Support</p>
              <a
                href="mailto:jun.partner@coze.email"
                className="text-xl text-[#FFB800] hover:underline font-display"
              >
                jun.partner@coze.email
              </a>
            </div>

            <p className="leading-relaxed mb-6">
              When contacting us, please include your account email and a description of the issue. Screenshots help us resolve problems faster.
            </p>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
