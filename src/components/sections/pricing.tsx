'use client';

import Link from 'next/link';
import { Check, Minus } from 'lucide-react';
import { CreemCheckout } from '@creem_io/nextjs';
import { useAuth } from '@clerk/nextjs';

const isTestMode = process.env.NEXT_PUBLIC_CREEM_TEST_MODE === 'true';

const PRODUCT_IDS = isTestMode
  ? {
      starter: 'prod_7lVPw6BIdARHnHp0q8NUq',
      pro: 'prod_5Ys18YHDcghSmzQiH34m1F',
      business: 'prod_6Ce4UEHVAHQuKD8rXeqrHJ',
    }
  : {
      starter: 'prod_7n0brGEbo1u1yDHsf1gI8r',
      pro: 'prod_15GyxRDvbgQAS0FFKb8ayp',
      business: 'prod_3i1ndQTCMKtqaswpGDLwWM',
    };

const plans = [
  {
    name: 'Free',
    price: 0,
    priceNote: '/mo',
    features: [
      { text: '5 pages per month', included: true },
      { text: 'All styles', included: true },
      { text: 'PNG download', included: true },
      { text: 'No watermark', included: false },
    ],
    buttonText: 'Get Started',
    buttonStyle: 'outline' as const,
    href: '/generate',
    productId: null,
  },
  {
    name: 'Starter',
    price: 4.99,
    priceNote: '/mo',
    features: [
      { text: '100 pages per month', included: true },
      { text: 'All styles', included: true },
      { text: 'PNG download', included: true },
      { text: 'No watermark', included: true },
      { text: 'PDF export', included: false },
      { text: 'Commercial use', included: false },
    ],
    buttonText: 'Subscribe',
    buttonStyle: 'filled' as const,
    href: null,
    productId: PRODUCT_IDS.starter,
  },
  {
    name: 'Pro',
    price: 9.99,
    priceNote: '/mo',
    popular: true,
    features: [
      { text: '500 pages per month', included: true },
      { text: 'All styles', included: true },
      { text: 'PNG & PDF download', included: true },
      { text: 'No watermark', included: true },
      { text: 'Commercial license', included: true },
      { text: 'Priority support', included: true },
    ],
    buttonText: 'Subscribe',
    buttonStyle: 'gradient' as const,
    href: null,
    productId: PRODUCT_IDS.pro,
  },
  {
    name: 'Business',
    price: 19.99,
    priceNote: '/mo',
    features: [
      { text: '2000 pages per month', included: true },
      { text: 'All styles', included: true },
      { text: 'PNG & PDF download', included: true },
      { text: 'No watermark', included: true },
      { text: 'Commercial license', included: true },
      { text: 'Priority support', included: true },
      { text: 'API access', included: true },
    ],
    buttonText: 'Subscribe',
    buttonStyle: 'filled' as const,
    href: null,
    productId: PRODUCT_IDS.business,
  },
];

export function Pricing() {
  const { isSignedIn, userId } = useAuth();

  return (
    <section id="pricing" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <h2 className="font-display text-[32px] md:text-[40px] text-foreground text-center mb-16">
          Simple Pricing
        </h2>

        {/* Pricing Grid - 4 columns */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-5 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? 'border-2 border-[#FFB800] bg-[#FFF3CC]'
                  : 'bg-white border-2 border-transparent'
              }`}
              style={{
                boxShadow: plan.popular
                  ? '0 8px 24px rgba(26,26,46,0.12)'
                  : '0 4px 12px rgba(26,26,46,0.08)',
                transform: plan.popular ? 'scale(1.02)' : undefined,
              }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full text-xs font-bold text-[#1A1A2E]"
                  style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)' }}
                >
                  Popular
                </div>
              )}

              {/* Plan Name */}
              <h3 className="font-display text-[22px] text-foreground mb-2">
                {plan.name}
              </h3>

              {/* Price */}
              <div className="mb-6">
                <span className="font-display text-[44px] text-foreground">
                  ${plan.price}
                </span>
                <span className="text-base text-[#8A8A9A] font-normal">
                  {plan.priceNote}
                </span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-[15px]">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-[#2ECC71] flex-shrink-0" />
                    ) : (
                      <Minus className="w-4 h-4 text-[#8A8A9A] flex-shrink-0" />
                    )}
                    <span className={feature.included ? 'text-[#4A4A5E]' : 'text-[#8A8A9A]'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              {plan.productId && isSignedIn ? (
                <CreemCheckout
                  productId={plan.productId}
                  successUrl="/generate"
                  referenceId={userId}
                  metadata={{ userId: userId }}
                >
                  <button
                    className={`block w-full py-3.5 rounded-xl font-bold text-center transition-all ${
                      plan.buttonStyle === 'filled'
                        ? 'bg-[#1A1A2E] text-white hover:bg-[#1A1A2E]/90'
                        : 'text-[#1A1A2E] hover:-translate-y-0.5'
                    }`}
                    style={
                      plan.buttonStyle === 'gradient'
                        ? { background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)', boxShadow: '0 4px 16px rgba(255,107,107,0.3)' }
                        : undefined
                    }
                  >
                    {plan.buttonText}
                  </button>
                </CreemCheckout>
              ) : plan.productId ? (
                <Link
                  href="/generate"
                  className={`block w-full py-3.5 rounded-xl font-bold text-center transition-all ${
                    plan.buttonStyle === 'filled'
                      ? 'bg-[#1A1A2E] text-white hover:bg-[#1A1A2E]/90'
                      : 'text-[#1A1A2E] hover:-translate-y-0.5'
                  }`}
                  style={
                    plan.buttonStyle === 'gradient'
                      ? { background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)', boxShadow: '0 4px 16px rgba(255,107,107,0.3)' }
                      : undefined
                  }
                >
                  Sign Up to Subscribe
                </Link>
              ) : (
                <Link
                  href={plan.href!}
                  className={`block w-full py-3.5 rounded-xl font-bold text-center transition-all ${
                    plan.buttonStyle === 'outline'
                      ? 'border-2 border-[#E8E0D0] text-foreground hover:border-[#FFB800] hover:text-[#FFB800]'
                      : ''
                  }`}
                >
                  {plan.buttonText}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
