import { Sparkles, Zap, Download } from 'lucide-react';

const highlights = [
  {
    icon: Sparkles,
    tag: 'Any Theme',
    text: 'Describe anything — from "sleepy koala" to "fire-breathing dragon" — and get clean line art instantly.',
  },
  {
    icon: Download,
    tag: 'Print-Ready',
    text: 'High-resolution output at 300 DPI. Perfect for home printers or professional publishing.',
  },
  {
    icon: Zap,
    tag: 'Free to Start',
    text: 'Generate 5 coloring pages per month for free. No credit card required to try it out.',
  },
] as const;

export function WhyColorForge() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <h2 className="font-display text-2xl md:text-3xl text-center mb-12 flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Why ColorForge?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.tag}
                className="bg-card rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-display text-sm text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {item.tag}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
