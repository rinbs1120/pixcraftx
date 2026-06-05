'use client';

import Link from 'next/link';
import { Check, Minus } from 'lucide-react';
import { CreemCheckout } from '@creem_io/nextjs';
import { useAuth, useClerk } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

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

const PLAN_RANK: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  business: 3,
};

const allFeatures = [
  { key: 'pages', label: 'Credits per month' },
  { key: 'styles', label: 'All styles' },
  { key: 'reference', label: 'Reference image upload' },
  { key: 'png', label: 'PNG download' },
  { key: 'pdf', label: 'PDF export' },
  { key: 'watermark', label: 'No watermark' },
  { key: 'commercial', label: 'Commercial license' },
  { key: 'support', label: 'Priority support' },
  { key: 'api', label: 'API access' },
] as const;

type FeatureKey = typeof allFeatures[number]['key'];

const isLaunchPromo = new Date() < new Date('2026-09-01T00:00:00Z');

const plans = [
  {
    name: 'Free',
    key: 'free',
    price: 0,
    originalPrice: null,
    priceNote: '/mo',
    pageLabel: '2 credits',
    features: { pages: true, styles: true, reference: false, png: true, pdf: false, watermark: false, commercial: false, support: false, api: false } as Record<FeatureKey, boolean>,
    buttonText: 'Get Started',
    buttonStyle: 'outline' as const,
    href: '/generate',
    productId: null,
  },
  {
    name: 'Starter',
    key: 'starter',
    price: 4.99,
    originalPrice: isLaunchPromo ? 6.99 : null,
    priceNote: '/mo',
    pageLabel: '60 credits',
    features: { pages: true, styles: true, reference: true, png: true, pdf: false, watermark: true, commercial: false, support: false, api: false } as Record<FeatureKey, boolean>,
    buttonText: 'Subscribe',
    buttonStyle: 'filled' as const,
    href: null,
    productId: PRODUCT_IDS.starter,
  },
  {
    name: 'Pro',
    key: 'pro',
    price: 9.99,
    originalPrice: isLaunchPromo ? 12.99 : null,
    priceNote: '/mo',
    popular: true,
    pageLabel: '300 credits',
    features: { pages: true, styles: true, reference: true, png: true, pdf: true, watermark: true, commercial: true, support: true, api: false } as Record<FeatureKey, boolean>,
    buttonText: 'Subscribe',
    buttonStyle: 'gradient' as const,
    href: null,
    productId: PRODUCT_IDS.pro,
  },
  {
    name: 'Business',
    key: 'business',
    price: 19.99,
    originalPrice: isLaunchPromo ? 24.99 : null,
    priceNote: '/mo',
    pageLabel: '1000 credits',
    features: { pages: true, styles: true, reference: true, png: true, pdf: true, watermark: true, commercial: true, support: true, api: true } as Record<FeatureKey, boolean>,
    buttonText: 'Subscribe',
    buttonStyle: 'filled' as const,
    href: null,
    productId: PRODUCT_IDS.business,
  },
];

export function Pricing() {
  const { isSignedIn, userId } = useAuth();
  const { openSignIn } = useClerk();
  const [currentPlan, setCurrentPlan] = useState<string>('free');

  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/usage')
        .then(res => res.json())
        .then(data => {
          if (data.plan) setCurrentPlan(data.plan);
        })
        .catch(() => {});
    }
  }, [isSignedIn]);

  const currentRank = PLAN_RANK[currentPlan] || 0;

  return (
    <section id="pricing" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="text-center mb-6">
          <h2 className="font-display text-[32px] md:text-[40px] text-foreground mb-4">
            Simple Pricing
          </h2>
          {isLaunchPromo && (
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#FFF3CC] border border-[#FFB800]">
              <span className="text-sm font-semibold text-[#1A1A2E]">🎉 Launch Special</span>
              <span className="text-sm text-[#8A8A9A]">Special pricing ends Sep 2026</span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-5">
          {plans.map((plan) => {
            const planRank = PLAN_RANK[plan.key] || 0;
            const isCurrent = plan.key === currentPlan;
            const isLower = planRank < currentRank;
            const isUpgrade = planRank > currentRank;

            return (
              <div
                key={plan.name}
                className={`relative rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1 flex flex-col ${
                  isCurrent
                    ? 'border-2 border-[#2ECC71] bg-[#E8FBF0]'
                    : plan.popular
                      ? 'border-2 border-[#FFB800] bg-[#FFF3CC]'
                      : 'bg-white border-2 border-transparent'
                } ${isLower ? 'opacity-50' : ''}`}
                style={{
                  boxShadow: isCurrent
                    ? '0 8px 24px rgba(46,204,113,0.15)'
                    : plan.popular
                      ? '0 8px 24px rgba(26,26,46,0.12)'
                      : '0 4px 12px rgba(26,26,46,0.08)',
                  transform: plan.popular ? 'scale(1.02)' : undefined,
                }}
              >
                {plan.popular && !isCurrent && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full text-xs font-bold text-[#1A1A2E]"
                    style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)' }}
                  >
                    Popular
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full text-xs font-bold text-white bg-[#2ECC71]">
                    Current Plan
                  </div>
                )}

                <h3 className="font-display text-[22px] text-foreground mb-2">
                  {plan.name}
                </h3>

                <div className="mb-6">
                  {plan.price === 0 ? (
                    <>
                      <span className="font-display text-[44px] text-foreground">Free</span>
                      <span className="text-base text-[#8A8A9A] font-normal">{plan.priceNote}</span>
                    </>
                  ) : plan.originalPrice ? (
                    <div className="flex flex-col">
                      <span className="font-display text-[16px] text-[#8A8A9A] line-through">
                        ${plan.originalPrice}{plan.priceNote}
                      </span>
                      <div className="flex items-baseline">
                        <span className="font-display text-[44px] text-foreground">
                          ${plan.price}
                        </span>
                        <span className="text-base text-[#8A8A9A] font-normal">
                          {plan.priceNote}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="font-display text-[44px] text-foreground">${plan.price}</span>
                      <span className="text-base text-[#8A8A9A] font-normal">{plan.priceNote}</span>
                    </>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {allFeatures.map((feat) => {
                    const included = plan.features[feat.key];
                    const isPages = feat.key === 'pages';
                    return (
                      <li key={feat.key} className="flex items-center gap-2 text-[15px]">
                        {included ? (
                          <Check className="w-4 h-4 text-[#2ECC71] flex-shrink-0" />
                        ) : (
                          <Minus className="w-4 h-4 text-[#8A8A9A] flex-shrink-0" />
                        )}
                        <span className={included ? 'text-[#4A4A5E]' : 'text-[#8A8A9A]'}>
                          {isPages ? plan.pageLabel : feat.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-auto">
                {isCurrent ? (
                  <button
                    className="block w-full py-3.5 rounded-xl font-bold text-center bg-[#2ECC71] text-white cursor-default"
                    disabled
                  >
                    Current Plan
                  </button>
                ) : isLower ? (
                  <button
                    className="block w-full py-3.5 rounded-xl font-bold text-center bg-[#E8E0D0] text-[#8A8A9A] cursor-not-allowed"
                    disabled
                  >
                    Included in your plan
                  </button>
                ) : plan.productId && isSignedIn ? (
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
                      {isUpgrade ? 'Upgrade' : plan.buttonText}
                    </button>
                  </CreemCheckout>
                ) : plan.productId ? (
                  <button
                    onClick={() => openSignIn()}
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
                  </button>
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
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            💡 Text generation: <strong>1 credit</strong> per page. Reference image generation: <strong>5 credits</strong> per page.
          </p>
        </div>
      </div>
    </section>
  );
}