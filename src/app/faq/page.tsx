import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'Frequently Asked Questions',
  description: 'PixCraftX frequently asked questions and answers.',
};

const faqs = [
  {
    question: 'What is PixCraftX?',
    answer:
      'PixCraftX is an AI-powered coloring page and merch creator. Generate stunning line art from any idea, color it with AI styles, then turn it into fridge magnets, stickers, and canvas prints. Designed for kids, parents, teachers, and creators.',
  },
  {
    question: 'How does it work?',
    answer:
      'Three simple steps: (1) Generate — type a description and AI creates clean line art. (2) Color & Style — apply color palettes or art styles like Pop Art and City Pop with one click. (3) Turn into Merch — transform your colored art into fridge magnets, stickers, or canvas prints, ready to download.',
  },
  {
    question: 'Is it free?',
    answer:
      'Yes! PixCraftX offers a free plan that includes 2 credits per month. If you need more, our Starter, Pro and Business plans provide additional monthly credits and exclusive features like transparent PNG downloads and merch products. Visit our pricing page for details.',
  },
  {
    question: 'What styles are available?',
    answer:
      'Three color palettes (Pastel, Vivid, Muted) for natural coloring, plus four art styles (Chubby Doodle, Pop Art, City Pop, Fridge Magnet) for creative transformations. Each style transforms your line art with a unique visual personality.',
  },
  {
    question: 'What merch products can I make?',
    answer:
      'Currently we support three products: Canvas Prints (direct download, free), Fridge Magnets (2 credits, with white background removed), and Stickers (2 credits, transparent PNG). All product images are high-resolution and ready for production.',
  },
  {
    question: 'Can I use generated images commercially?',
    answer:
      'Pro and Business plan subscribers are granted a commercial license to use generated images for commercial purposes. Starter plan and Free plan users are limited to personal, non-commercial use only. Please review our Terms of Service for full details.',
  },
  {
    question: 'Is it safe for children?',
    answer:
      'Yes. All prompts are filtered through our content moderation system to block inappropriate or harmful content. We take child safety seriously and continuously improve our moderation. However, parental supervision is always recommended.',
  },
  {
    question: 'How do I cancel my subscription?',
    answer:
      'You can cancel your subscription at any time from your account settings. Your access will remain active until the end of the current billing period. No further charges will be made after cancellation.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'All payments are processed securely through Creem, which supports a variety of international payment methods including major credit and debit cards. You will be able to select your preferred method at checkout.',
  },
  {
    question: 'How do I request a refund?',
    answer:
      'You can request a refund within 7 days of purchase by emailing support@pixcraftx.com with your account information and order number. Please see our Refund Policy for full details on eligibility and processing times.',
  },
  {
    question: 'Who made this?',
    answer:
      'PixCraftX is built by the PixCraftX team — a small group of designers and engineers passionate about making creativity accessible to everyone through AI. Visit pixcraftx.com to learn more.',
  },
];

export default function FAQPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl mb-8 text-center">
            Frequently Asked Questions
          </h1>

          <div className="prose prose-lg max-w-none text-muted-foreground">
            {faqs.map((faq, index) => (
              <div key={index}>
                <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
                  {faq.question}
                </h2>
                <p className="leading-relaxed mb-6">
                  {faq.answer}
                </p>
              </div>
            ))}

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              Still have questions?
            </h2>
            <p className="leading-relaxed mb-6">
              We&apos;re here to help! Reach out to us at{' '}
              <a href="mailto:support@pixcraftx.com" className="text-primary hover:underline">
                support@pixcraftx.com
              </a>{' '}
              and we&apos;ll get back to you as soon as possible.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
