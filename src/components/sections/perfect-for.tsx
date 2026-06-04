import { Users, GraduationCap, Palette } from 'lucide-react';

const personas = [
  {
    icon: Users,
    emoji: '\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67',
    title: 'Parents',
    headline: 'Endless activities for kids',
    points: [
      'Generate any theme your child loves',
      'Upload a photo of their pet to color',
      'Simple style = perfect for little hands',
    ],
    color: '#FFB800',
    bg: '#FFF3CC',
  },
  {
    icon: GraduationCap,
    emoji: '\ud83d\udc69\u200d\ud83d\udcbb',
    title: 'Teachers',
    headline: 'Educational pages in seconds',
    points: [
      'Alphabet, numbers, science — any topic',
      'Customize for your lesson plan',
      'Print-ready at 300 DPI for handouts',
    ],
    color: '#9B59B6',
    bg: '#F3E5F5',
  },
  {
    icon: Palette,
    emoji: '\ud83c\udfa8',
    title: 'Creators',
    headline: 'Build your coloring book empire',
    points: [
      'Batch generate for KDP / Etsy',
      'Commercial license included in Pro+',
      'Upload reference art for consistent style',
    ],
    color: '#2ECC71',
    bg: '#E8FBF0',
  },
];

export function PerfectFor() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
            Perfect For
          </h2>
          <p className="text-muted-foreground text-lg">
            Whether you're a parent, teacher, or creator — PixCraftX fits your needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {personas.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="rounded-3xl p-8 border-2 border-transparent hover:border-[#FFB800]/30 transition-all hover:-translate-y-1"
                style={{ background: p.bg }}
              >
                <div className="text-4xl mb-4">{p.emoji}</div>
                <h3 className="font-display text-2xl text-foreground mb-2">{p.title}</h3>
                <p className="text-sm font-semibold mb-4" style={{ color: p.color }}>{p.headline}</p>
                <ul className="space-y-2">
                  {p.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#4A4A5E]">
                      <span className="mt-0.5 flex-shrink-0" style={{ color: p.color }}>&#10003;</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
