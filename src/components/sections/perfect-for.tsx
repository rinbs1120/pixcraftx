import { Users, GraduationCap, Palette } from 'lucide-react';

const personas = [
  {
    icon: Users,
    emoji: '👨‍👩‍👧',
    title: 'Parents',
    headline: 'Creative fun for the whole family',
    points: [
      'Generate any theme your child loves',
      'Color together, then make fridge magnets',
      'Turn their art into real keepsakes',
    ],
    color: '#FFB800',
    bg: 'rgba(255, 184, 0, 0.08)',
  },
  {
    icon: GraduationCap,
    emoji: '👩‍💼',
    title: 'Teachers',
    headline: 'Educational pages in seconds',
    points: [
      'Alphabet, numbers, science — any topic',
      'Customize for your lesson plan',
      'Print-ready at 300 DPI for handouts',
    ],
    color: '#9B59B6',
    bg: 'rgba(155, 89, 182, 0.08)',
  },
  {
    icon: Palette,
    emoji: '🎨',
    title: 'Creators',
    headline: 'Turn art into sellable merch',
    points: [
      'Generate line art, color it, make products',
      'Fridge magnets, stickers, canvas prints',
      'Commercial license included in Pro+',
    ],
    color: '#2ECC71',
    bg: 'rgba(46, 204, 113, 0.08)',
  },
];

export function PerfectFor() {
  return (
    <section
      className="py-16 md:py-24"
      style={{ background: 'linear-gradient(180deg, #1A1A2E 0%, #24243E 100%)' }}
    >
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-[40px] text-white mb-4">
            Perfect For
          </h2>
          <p className="text-gray-400 text-lg">
            Whether you&apos;re a parent, teacher, or creator — PixCraftX fits your needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {personas.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="rounded-3xl p-8 border border-white/10 hover:border-[#FFB800]/30 transition-all hover:-translate-y-1"
                style={{ background: p.bg, backdropFilter: 'blur(10px)' }}
              >
                <div className="text-4xl mb-4">{p.emoji}</div>
                <h3 className="font-display text-2xl text-white mb-2">{p.title}</h3>
                <p className="text-sm font-semibold mb-4" style={{ color: p.color }}>{p.headline}</p>
                <ul className="space-y-2">
                  {p.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
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
