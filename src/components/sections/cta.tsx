import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/50">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center">
        <h2 className="font-display text-3xl md:text-4xl mb-6">
          Ready to Create Something Unique?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Generate line art, color it with AI styles, then turn it into fridge magnets, stickers, and prints.
        </p>
        <Link
          href="/generate"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-lg rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
        >
          <Sparkles className="w-5 h-5" />
          Start Creating for Free
        </Link>
      </div>
    </section>
  );
}
