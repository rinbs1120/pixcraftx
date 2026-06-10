'use client';

import Link from 'next/link';
import { useScrolled } from '@/hooks/use-scrolled';
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { Menu, X, Crown, Loader2 } from 'lucide-react';
import { InvitePanel } from '@/components/invite-panel';
import { useState, useEffect } from 'react';

export function Navbar() {
  const scrolled = useScrolled();
  const { isSignedIn, isLoaded } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setPlan(null);
      return;
    }
    fetch('/api/usage')
      .then(res => res.json())
      .then(data => {
        if (data.plan) setPlan(data.plan);
      })
      .catch(() => {});
  }, [isSignedIn]);

  const planLabel = plan
    ? plan.charAt(0).toUpperCase() + plan.slice(1)
    : null;

  const planBadgeClass = plan === 'business'
    ? 'bg-purple-100 text-purple-700 border-purple-200'
    : plan === 'pro'
    ? 'bg-amber-100 text-amber-700 border-amber-200'
    : plan === 'starter'
    ? 'bg-green-100 text-green-700 border-green-200'
    : 'bg-gray-100 text-gray-500 border-gray-200';

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300',
          'backdrop-blur-xl',
          scrolled ? 'shadow-md border-b border-border' : 'border-b border-transparent'
        )}
        style={{ backgroundColor: 'rgba(255,251,240,0.92)' }}
      >
        <div className="container mx-auto px-4 md:px-6 h-full flex items-center justify-between max-w-7xl"
        >
          <Link href="/" className="flex items-center gap-2">
            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" role="img" aria-label="PixCraftX logo">
              <circle cx="16" cy="16" r="14" fill="#FFB800" opacity="0.15" />
              <circle cx="11" cy="13" r="3.5" fill="#FF6B6D" />
              <circle cx="21" cy="13" r="3.5" fill="#2ECC71" />
              <circle cx="16" cy="21" r="3.5" fill="#FFB800" />
              <circle cx="16" cy="13" r="2" fill="#1A1A2E" />
            </svg>
            <span className="font-display text-xl md:text-2xl">
              <span className="text-primary">Pix</span>
              <span className="text-foreground">CraftX</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/free-coloring-pages" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Free Pages
            </Link>
            <Link href="/generate" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Generate
            </Link>
            <Link href="/auto-color" className="text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Color & Style
            </Link>
            {isSignedIn && (
              <Link href="/history" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                My Pages
              </Link>
            )}
            <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Pricing
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {!isLoaded ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : isSignedIn ? (
              <div className="flex items-center gap-2">
                <InvitePanel />
                <div className="relative">
                  <UserButton />
                  {planLabel && (
                    <span className={`absolute -bottom-1 -right-1 inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full text-[10px] font-bold border ${planBadgeClass} shadow-sm`}>
                      <Crown className="w-2.5 h-2.5" />
                      {planLabel}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="text-muted-foreground hover:text-primary transition-colors font-semibold">
                    Log in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-6 py-2 font-semibold rounded-full transition-all hover:translate-y-0.5 text-[#1A1A2E] hover:bg-[#1A1A2E]/90" style={{ background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6D 100%)', boxShadow: '0 2px 8px rgba(255,184,0,0.3)' }}>
                    Sign Up
                  </button>
                </SignUpButton>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/98 backdrop-blur-xl md:hidden pt-16">
          <div className="flex flex-col items-center justify-center gap-8 h-full">
            <Link href="/free-coloring-pages" className="text-xl font-semibold text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              Free Pages
            </Link>
            <Link href="/generate" className="text-xl font-semibold text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              Generate
            </Link>
            <Link href="/auto-color" className="text-xl font-semibold text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              Auto Color
            </Link>
            {isSignedIn && (
              <Link href="/history" className="text-xl font-semibold text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                My Pages
              </Link>
            )}
            <Link href="/pricing" className="text-xl font-semibold text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              Pricing
            </Link>
            {!isLoaded ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : isSignedIn ? (
              <div className="flex items-center gap-3">
                {planLabel && (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${planBadgeClass}`}>
                    <Crown className="w-4 h-4" />
                    {planLabel}
                  </span>
                )}
                <InvitePanel />
                <UserButton />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <SignInButton mode="modal">
                  <button className="text-lg font-semibold text-muted-foreground">Log in</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-full shadow-md">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
