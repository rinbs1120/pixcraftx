import { Pencil, Upload, Sparkles, Palette, Printer, ArrowRight } from 'lucide-react';

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
    title: 'Choose Style',
    description: 'Pick Simple, Mandala, or Intricate to match your vision',
    icon: Sparkles,
  },
  {
    number: 3,
    title: 'Generate',
    description: 'AI creates a clean, printable line art coloring page',
    icon: Sparkles,
  },
  {
    number: 4,
    title: 'Color or Print',
    description: 'Color it online in your browser, or download and print',
    icon: Palette,
    subIcon: Printer,
  },
];

export function HowItWorks() {
  return (
    <section
      className="py-16 md:py-24"
      style={{ background: 'linear-gradient(180deg, #1A1A2E 0%, #24243E 100%)' }}
    >
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <h2 className="font-display text-3xl md:text-[40px] text-white text-center mb-16">
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
                    style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)' }}
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
