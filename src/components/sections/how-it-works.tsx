import { Pencil, Upload, Sparkles, Palette, Package, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Describe or Upload',
    description: 'Type what you want, or upload a reference photo to transform',
    icon: Pencil,
    subIcon: Upload,
  },
  {
    number: 2,
    title: 'Generate Line Art',
    description: 'AI creates clean line art from your description',
    icon: Sparkles,
  },
  {
    number: 3,
    title: 'Color & Merch',
    description: 'Apply colors and art styles with one click',
    icon: Sparkles,
  },
  {
    number: 4,
    title: 'Turn into Merch',
    description: 'Make fridge magnets, stickers, or canvas prints',
    icon: Palette,
    subIcon: Package,
  },
];

export function HowItWorks() {
  return (
    <section
      className="py-20 md:py-28"
      style={{ background: 'linear-gradient(180deg, #1A1A2E 0%, #24243E 100%)' }}
    >
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <h2 className="font-display text-[32px] md:text-[40px] text-white text-center mb-12" style={{ letterSpacing: '-0.5px' }}>
          How It Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: '#FFB800' }}
                  >
                    <Icon className="w-7 h-7 text-[#1A1A2E]" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white text-[#1A1A2E] text-xs font-bold flex items-center justify-center">
                    {step.number}
                  </span>
                </div>
                <h3 className="font-display text-lg text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.description}</p>
                {idx < steps.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-[#FFB800] mt-4 hidden md:block" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
