import { Sparkles, Upload, Palette, Zap } from 'lucide-react';

const highlights = [
  {
    icon: Sparkles,
    tag: 'Any Theme',
    text: 'Describe anything — from "sleepy koala" to "fire-breathing dragon" — and get clean line art instantly.',
  },
  {
    icon: Upload,
    tag: 'Reference Upload',
    text: "Upload any photo and we'll transform it into a coloring page while keeping the composition and subject.",
  },
  {
    icon: Palette,
    tag: 'Color Online',
    text: "Don't just generate — color it right in your browser with our built-in digital coloring tool.",
  },
  {
    icon: Zap,
    tag: 'Free to Start',
    text: 'Get 2 free credits per month. Auto-color your pages or transform them with 5 art styles. No credit card required.',
  },
] as const;

export function WhyPixCraftX() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <h2 className="font-display text-2xl md:text-3xl text-center mb-12 font-semibold text-foreground">
          Why PixCraftX?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {highlights.map((h) => {
            const Icon = h.icon;
            return (
              <div key={h.tag} className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#FFF3CC] flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[#FFB800]" />
                </div>
                <span className="text-sm font-bold uppercase tracking-wide text-[#FFB800]">{h.tag}</span>
                <p className="text-sm text-muted-foreground leading-relaxed">{h.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
