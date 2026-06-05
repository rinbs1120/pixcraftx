import Link from 'next/link';

const productLinks = [
  { label: 'Generate', href: '/generate' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/faq' },
];

const resourceLinks = [
  { label: 'Help', href: '/help' },
];

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Refund Policy', href: '/refund' },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-16 md:py-20 bg-[#1A1A2E]">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" role="img" aria-label="PixCraftX logo">
                <circle cx="16" cy="16" r="14" fill="#FFB800" opacity="0.15" />
                <circle cx="11" cy="13" r="3.5" fill="#FF6B6B" />
                <circle cx="21" cy="13" r="3.5" fill="#2ECC71" />
                <circle cx="16" cy="21" r="3.5" fill="#FFB800" />
                <circle cx="16" cy="13" r="2" fill="#1A1A2E" />
              </svg>
              <span className="font-display text-xl">
                <span className="text-[#FFB800]">Pix</span>
                <span className="text-[#FFFBF0]">CraftX</span>
              </span>
            </Link>
            <p className="text-sm text-[#B0B0C0] leading-relaxed max-w-[260px]">
              AI-powered coloring page generator for kids, teachers, and creators. Turn any idea into print-ready line art.
            </p>
          </div>

          <div>
            <h4 className="font-display text-base text-[#FFFBF0] mb-4">Product</h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-[#B0B0C0] hover:text-[#FFB800] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-base text-[#FFFBF0] mb-4">Resources</h4>
            <ul className="space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-[#B0B0C0] hover:text-[#FFB800] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-base text-[#FFFBF0] mb-4">Legal</h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-[#B0B0C0] hover:text-[#FFB800] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#2A2A3E]">
          <p className="text-center text-sm text-[#B0B0C0]">
            © {currentYear} PixCraftX. Made with{' '}
            <span className="text-[#FF6B6B]">❤</span> for creators.
          </p>
          <p className="text-center text-xs text-[#808090] mt-2">
            Powered by Fal.ai & AILabTools. All generated content is AI-created.
          </p>
        </div>
      </div>
    </footer>
  );
}
