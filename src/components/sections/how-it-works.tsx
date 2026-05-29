import { Pencil, Sparkles, Printer, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Describe',
    description: 'Type your idea in plain English',
    icon: Pencil,
  },
  {
    number: 2,
    title: 'Generate',
    description: 'AI creates your line art',
    icon: Sparkles,
  },
  {
    number: 3,
    title: 'Print',
    description: 'Download & print instantly',
    icon: Printer,
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

        {/* Steps Row with Arrows */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-0">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="flex items-center">
                {/* Step Card */}
                <div className="flex flex-col items-center text-center px-8 md:px-10">
                  {/* Number Circle */}
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-[#FFB800] mb-4"
                    style={{ background: 'rgba(255,184,0,0.15)' }}
                  >
                    {step.number}
                  </div>
                  
                  {/* Icon */}
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(255,184,0,0.15)' }}
                  >
                    <Icon className="w-8 h-8 text-[#FFB800]" />
                  </div>
                  
                  {/* Title */}
                  <h3 className="font-display text-xl md:text-2xl text-white mb-2">
                    {step.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-[#B0B0C0] text-sm md:text-base max-w-[140px]">
                    {step.description}
                  </p>
                </div>

                {/* Arrow (except after last step) */}
                {index < steps.length - 1 && (
                  <ArrowRight className="hidden md:block w-6 h-6 text-[#FFB800] mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
