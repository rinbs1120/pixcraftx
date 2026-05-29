'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: 'How do I create a coloring page?',
    answer:
      'Simply type a description of what you want — like "a cute dinosaur eating ice cream" — select a style (Kids, Mandala, or Detailed), and click Generate. Our AI will create a clean line art coloring page in seconds.',
  },
  {
    question: 'What styles are available?',
    answer:
      'We offer three core styles: Kids (bold lines, simple shapes perfect for young children), Mandala (symmetrical circular patterns for relaxation), and Detailed (fine lines and intricate designs for adults).',
  },
  {
    question: 'Can I use the images commercially?',
    answer:
      'Yes! Pro and Business plans include commercial use rights, so you can sell coloring books on KDP, Etsy, or your own store. Free and Starter plans are for personal use only.',
  },
  {
    question: 'What file formats can I download?',
    answer:
      'All plans include PNG download (high resolution, 300 DPI). Starter and above plans also include PDF export for easy printing.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'Yes! You can generate 5 coloring pages per month for free, no credit card required. This lets you try out the quality before subscribing.',
  },
] as const;

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 md:py-24 bg-muted/30" id="faq">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <h2 className="font-display text-3xl md:text-4xl text-center mb-12 md:mb-16">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-card rounded-xl shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-5 py-4 flex items-center justify-between text-left font-semibold hover:bg-muted/30 transition-colors"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 text-muted-foreground transition-transform duration-200',
                    openIndex === index && 'rotate-180'
                  )}
                />
              </button>
              <div
                className={cn(
                  'px-5 overflow-hidden transition-all duration-200',
                  openIndex === index ? 'max-h-48 pb-4' : 'max-h-0'
                )}
              >
                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
