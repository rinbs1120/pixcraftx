'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: 'How do I create a coloring page?',
    answer:
      'Simply type a description of what you want — like "a Chinese dragon soaring through clouds" — and click Generate. Our AI will create a clean line art coloring page in seconds.',
  },
  {
    question: 'What styles are available?',
    answer:
      'Three color palettes (Pastel, Vivid, Muted) for natural coloring, plus four art styles (Chubby Doodle, Pop Art, City Pop, Fridge Magnet) for creative transformations.',
  },
  {
    question: 'What merch can I make?',
    answer:
      'After coloring your line art, turn it into fridge magnets (2 cr), stickers (2 cr, transparent PNG), or canvas prints (free). Each product is generated as a high-resolution image ready for production.',
  },
  {
    question: 'Can I upload a reference image?',
    answer:
      'Yes! Upload any photo and our AI will transform it into a coloring page while preserving the composition and subject. This costs 5 credits per generation.',
  },
  {
    question: 'Can I use the images commercially?',
    answer:
      'Pro and Business plans include a commercial license, so you can use generated images for products, prints, and other commercial projects. Free and Starter plans are for personal, non-commercial use only.',
  },
  {
    question: 'How many pages can I generate for free?',
    answer:
      'Free accounts get 2 credits per month. Each text-generated page costs 1 credit, and reference image generation costs 5 credits (first one is free!). No credit card required to start.',
  },
  {
    question: 'What image formats are available for download?',
    answer:
      'All pages can be downloaded as high-resolution PNG files. Pro and Business plans also support PDF export and transparent PNG downloads for merch products.',
  },
  {
    question: 'Do free downloads have a watermark?',
    answer:
      'Free plan downloads include a subtle PixCraftX watermark. Starter plan and above get clean, watermark-free downloads.',
  },
  {
    question: 'What AI technology powers PixCraftX?',
    answer:
      'PixCraftX uses advanced AI image generation and editing models to transform your text descriptions into clean line art, apply colors and art styles, and generate merch product images. All generated content is AI-created and should be reviewed before use.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <h2 className="font-display text-3xl md:text-4xl text-center mb-12 text-foreground">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium text-foreground pr-4">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform',
                    openIndex === index && 'rotate-180'
                  )}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
