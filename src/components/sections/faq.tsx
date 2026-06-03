'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: 'How do I create a coloring page?',
    answer:
      'Simply type a description of what you want — like "a cute dinosaur eating ice cream" — select a style (Simple, Mandala, or Intricate), and click Generate. Our AI will create a clean line art coloring page in seconds.',
  },
  {
    question: 'What styles are available?',
    answer:
      'We offer three core styles: Simple (bold lines, large areas for kids), Mandala (symmetrical circular patterns for relaxation), and Intricate (fine lines and rich details for adults and artists).',
  },
  {
    question: 'Can I upload a reference image?',
    answer:
      'Yes! Upload any photo and our AI will transform it into a coloring page while preserving the composition and subject. This costs 5 credits per generation.',
  },
  {
    question: 'Can I color the pages online?',
    answer:
      'Absolutely! After generating a page, click the "Color It!" button to open our built-in digital coloring tool. Choose colors and fill areas with a click — no download needed.',
  },
  {
    question: 'Can I use the images commercially?',
    answer:
      'Yes! Pro and Business plans include a commercial license, so you can use generated pages for KDP books, Etsy products, and other commercial projects.',
  },
  {
    question: 'How many pages can I generate for free?',
    answer:
      'Free accounts get 5 credits per month. Each text-generated page costs 1 credit, and reference image generation costs 5 credits. No credit card required to start.',
  },
  {
    question: 'What image formats are available for download?',
    answer:
      'All pages can be downloaded as high-resolution PNG files. Pro and Business plans also support PDF export for easy printing.',
  },
  {
    question: 'What AI technology powers ColorForge?',
    answer:
      'ColorForge uses advanced AI image generation models powered by Fal.ai (including the Flux model family) and AILabTools. Our AI transforms your text descriptions and reference images into clean, printable coloring pages. All generated content is AI-created and should be reviewed before use.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
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
