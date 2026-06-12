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
    tag: 'Color & Merch',
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
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 md:px-6 max-w-[1440px]">
        {/* Section header with eyebrow */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-sm font-semibold" style={{ background: '#FFB80010', border: '1.5px solid #FFB80025', color: '#FFB800' }}>
            ✦ Why Us
          </span>
          <h2 className="font-display text-[32px] md:text-[40px] text-foreground" style={{ letterSpacing: '-0.5px' }}>
            Why PixCraftX?
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((h) => {
            const Icon = h.icon;
            return (
              <div
                key={h.tag}
                className="rounded-2xl p-6 border border-transparent hover:border-[#FFB800]/25 transition-all hover:-translate-y-1 bg-white group"
                style={{ boxShadow: '0 2px 12px rgba(26,26,46,0.06)' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors group-hover:bg-[#FFB800]" style={{ background: '#FFB80012' }}>
                  <Icon className="w-5 h-5 text-[#FFB800] group-hover:text-[#1A1A2E] transition-colors" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#FFB800] mb-2 block">{h.tag}</span>
                <p className="text-sm text-muted-foreground leading-relaxed">{h.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
