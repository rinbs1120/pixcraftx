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
      'PixCraftX is an AI-powered coloring page generator. Simply enter a text description of what you want, and PixCraftX will create a printable coloring page based on your prompt. It is designed for kids, parents, teachers, and anyone who loves coloring.',
  },
  {
    question: 'How does it work?',
    answer:
      'It is simple! Just type a text prompt describing the coloring page you want (for example, "a cute cat sitting on a windowsill"), and our AI will generate a black-and-white line art illustration. You can then download the image, print it, or color it directly in the browser.',
  },
  {
    question: 'Is it free?',
    answer:
      'Yes! PixCraftX offers a free plan that includes 5 coloring pages per month. If you need more, our Pro and Premium plans provide additional monthly generation quotas and exclusive features. Visit our pricing page for details.',
  },
  {
    question: 'What styles are available?',
    answer:
      'PixCraftX supports three main styles: Kids — bold, simple lines perfect for young children; Mandala — symmetrical, intricate patterns for a relaxing experience; and Detailed — fine, complex line art designed for adult colorists. You can select your preferred style when generating a page.',
  },
  {
    question: 'Can I use generated images commercially?',
    answer:
      'Paid subscribers may use generated coloring pages for personal and small-scale commercial purposes, subject to our Terms of Service. Free-plan users are limited to personal, non-commercial use. Please review our Terms of Service for full details on usage rights.',
  },
  {
    question: 'Is it safe for children?',
    answer:
      'Yes. All prompts are filtered through our content moderation API powered by Creem to block inappropriate or harmful content. We take child safety seriously and continuously improve our moderation systems. However, parental supervision is always recommended.',
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
