import { Sparkles, Upload, Palette, Zap } from 'lucide-react';

const highlights = [
  {
    icon: Sparkles,
    tag: 'Oriental Fantasy',
    text: 'From soaring dragons to moonlit pagodas — create stunning Oriental-themed line art with AI.',
  },
  {
    icon: Upload,
    tag: 'Reference Upload',
    text: "Upload any photo and we'll transform it into a coloring page while keeping the composition and subject.",
  },
  {
    icon: Palette,
    tag: 'Color & Style',
    text: 'Apply 3 color palettes or 4 art styles with one click. Pastel, Pop Art, City Pop, and more.',
  },
  {
    icon: Zap,
    tag: 'Turn into Merch',
    text: 'Transform your colored art into fridge magnets, stickers, and canvas prints. Download transparent PNGs ready for production.',
  },
] as const;

export function WhyPixCraftX() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6 max-w-[1440px]">
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
